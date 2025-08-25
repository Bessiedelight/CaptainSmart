import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/mongodb";
import { Comment, IComment, CommentUtils } from "@/databaseModels/commentModel";
import { Expose } from "@/databaseModels/exposeModel";

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Success response interface
interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

// Helper function to create error responses
function createErrorResponse(
  message: string,
  status: number,
  code?: string,
  details?: any
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
    },
    { status }
  );
}

// Helper function to handle database errors
function handleDatabaseError(error: unknown): NextResponse<ErrorResponse> {
  console.error("Database error:", error);

  if (error && typeof error === "object" && "name" in error) {
    const dbError = error as any;

    // Handle validation errors
    if (dbError.name === "ValidationError") {
      const validationErrors = Object.values(dbError.errors || {}).map(
        (err: any) => err.message
      );
      return createErrorResponse("Validation failed", 400, "VALIDATION_ERROR", {
        fields: validationErrors,
      });
    }

    // Handle duplicate key errors
    if (dbError.code === 11000) {
      return createErrorResponse(
        "Duplicate entry detected",
        409,
        "DUPLICATE_ERROR"
      );
    }

    // Handle connection errors
    if (
      dbError.name === "MongoNetworkError" ||
      dbError.name === "MongoTimeoutError"
    ) {
      return createErrorResponse(
        "Database connection failed. Please try again.",
        503,
        "DATABASE_CONNECTION_ERROR"
      );
    }
  }

  // Generic database error
  return createErrorResponse(
    "Database operation failed",
    500,
    "DATABASE_ERROR"
  );
}

// Helper function to get client IP address
function getClientIP(request: NextRequest): string {
  // Try to get IP from various headers (for proxy/load balancer scenarios)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("remote-addr");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (remoteAddr) {
    return remoteAddr;
  }

  // Fallback to a default IP if none found
  return "127.0.0.1";
}

// Helper function to get user agent
function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "Unknown";
}

// GET /api/expose/comments - Fetch comments for a specific expose with pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const exposeId = searchParams.get("exposeId");
    const limitParam = searchParams.get("limit") || "20";
    const offsetParam = searchParams.get("offset") || "0";
    const sortParam = searchParams.get("sort") || "newest";

    // Validate required parameters
    if (!exposeId) {
      return createErrorResponse(
        "exposeId parameter is required",
        400,
        "MISSING_EXPOSE_ID"
      );
    }

    // Validate exposeId format
    if (!exposeId.startsWith("expose_")) {
      return createErrorResponse(
        "Invalid expose ID format",
        400,
        "INVALID_EXPOSE_ID"
      );
    }

    // Validate pagination parameters
    const limit = parseInt(limitParam);
    const offset = parseInt(offsetParam);

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return createErrorResponse(
        "Limit must be a number between 1 and 50",
        400,
        "INVALID_LIMIT"
      );
    }

    if (isNaN(offset) || offset < 0) {
      return createErrorResponse(
        "Offset must be a non-negative number",
        400,
        "INVALID_OFFSET"
      );
    }

    // Validate sort parameter
    const validSorts = ["newest", "oldest"];
    if (!validSorts.includes(sortParam)) {
      return createErrorResponse(
        "Sort must be one of: newest, oldest",
        400,
        "INVALID_SORT"
      );
    }

    // Check if expose exists
    const expose = await Expose.findOne({ exposeId }).lean();
    if (!expose) {
      return createErrorResponse("Expose not found", 404, "EXPOSE_NOT_FOUND");
    }

    // Build sort criteria
    const sortCriteria =
      sortParam === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    // Fetch comments with pagination
    const comments = await Comment.find({ exposeId })
      .sort(sortCriteria)
      .limit(limit)
      .skip(offset)
      .lean();

    // Get total count for pagination
    const totalCount = await Comment.countDocuments({ exposeId });

    // Format comments for response
    const formattedComments = comments.map((comment: any) => ({
      ...comment,
      _id: comment._id.toString(),
      // Add time ago calculation
      timeAgo: (() => {
        const now = new Date();
        const diff = now.getTime() - comment.createdAt.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return "now";
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return comment.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      })(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        exposeId,
      },
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// POST /api/expose/comments - Submit a new comment
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return createErrorResponse(
        "Invalid JSON in request body",
        400,
        "INVALID_JSON"
      );
    }

    const { exposeId, content } = body;

    // Validate required fields
    if (!exposeId || !content) {
      return createErrorResponse(
        "exposeId and content are required",
        400,
        "MISSING_REQUIRED_FIELDS",
        {
          missing: [!exposeId && "exposeId", !content && "content"].filter(
            Boolean
          ),
        }
      );
    }

    // Validate field types
    if (typeof exposeId !== "string" || typeof content !== "string") {
      return createErrorResponse(
        "exposeId and content must be strings",
        400,
        "INVALID_FIELD_TYPES"
      );
    }

    // Validate exposeId format
    if (!exposeId.startsWith("expose_")) {
      return createErrorResponse(
        "Invalid expose ID format",
        400,
        "INVALID_EXPOSE_ID"
      );
    }

    // Validate content
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return createErrorResponse(
        "Comment content cannot be empty or only whitespace",
        400,
        "EMPTY_CONTENT"
      );
    }

    if (trimmedContent.length > 500) {
      return createErrorResponse(
        "Comment must be 500 characters or less",
        400,
        "CONTENT_TOO_LONG",
        { maxLength: 500, currentLength: trimmedContent.length }
      );
    }

    // Check if expose exists and is not expired
    const expose = await Expose.findOne({
      exposeId,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!expose) {
      return createErrorResponse(
        "Expose not found or has expired",
        404,
        "EXPOSE_NOT_FOUND_OR_EXPIRED"
      );
    }

    // Get client information for anonymous identification
    const clientIP = getClientIP(request);
    const userAgent = getUserAgent(request);

    // Generate anonymous ID and hash IP
    const anonymousId = CommentUtils.generateConsistentAnonymousId(
      clientIP,
      userAgent
    );
    const ipHash = CommentUtils.hashIP(clientIP);

    // Rate limiting: Check if user has posted too many comments recently
    const recentCommentsCount = await Comment.countDocuments({
      ipHash,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
    });

    if (recentCommentsCount >= 5) {
      return createErrorResponse(
        "Too many comments submitted recently. Please wait before commenting again.",
        429,
        "RATE_LIMIT_EXCEEDED",
        { retryAfter: 300 } // 5 minutes
      );
    }

    // Create new comment
    const newComment = new Comment({
      exposeId,
      content: trimmedContent,
      anonymousId,
      ipHash,
      userAgent: userAgent.substring(0, 500), // Truncate if too long
    });

    const savedComment = await newComment.save();

    // Update comment count on the expose document
    await Expose.updateOne({ exposeId }, { $inc: { commentCount: 1 } });

    // Format response
    const formattedComment = {
      ...savedComment.toObject(),
      _id: savedComment._id.toString(),
      timeAgo: "now",
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          comment: formattedComment,
          message: "Comment submitted successfully",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}
