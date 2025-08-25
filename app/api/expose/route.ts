import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/mongodb";
import { Expose, IExpose } from "@/databaseModels/exposeModel";
import "@/lib/startup"; // Initialize cleanup scheduler

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

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get("hashtag");
    const sort = searchParams.get("sort") || "newest";
    const limitParam = searchParams.get("limit") || "20";
    const offsetParam = searchParams.get("offset") || "0";

    // Validate pagination parameters
    const limit = parseInt(limitParam);
    const offset = parseInt(offsetParam);

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return createErrorResponse(
        "Limit must be a number between 1 and 100",
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
    const validSorts = ["newest", "trending", "expiring"];
    if (!validSorts.includes(sort)) {
      return createErrorResponse(
        "Sort must be one of: newest, trending, expiring",
        400,
        "INVALID_SORT"
      );
    }

    // Build query filter
    const filter: any = {
      expiresAt: { $gt: new Date() }, // Only get non-expired exposes
    };

    if (hashtag && hashtag !== "all") {
      // Validate hashtag format
      if (!hashtag.startsWith("#")) {
        return createErrorResponse(
          "Hashtag must start with #",
          400,
          "INVALID_HASHTAG"
        );
      }
      filter.hashtag = hashtag;
    }

    // Build sort criteria
    let sortCriteria: any = {};
    switch (sort) {
      case "trending":
        // Sort by net votes (upvotes - downvotes) descending, then by creation date
        sortCriteria = { upvotes: -1, downvotes: 1, createdAt: -1 };
        break;
      case "expiring":
        // Sort by expiration time ascending (expiring soonest first)
        sortCriteria = { expiresAt: 1 };
        break;
      case "newest":
      default:
        // Sort by creation date descending (newest first)
        sortCriteria = { createdAt: -1 };
        break;
    }

    // Execute query with pagination
    const exposes = await Expose.find(filter)
      .sort(sortCriteria)
      .limit(limit)
      .skip(offset)
      .lean();

    // Get total count for pagination
    const totalCount = await Expose.countDocuments(filter);

    // Calculate additional fields for each expose
    const exposesWithMetadata = exposes.map((expose: any) => {
      const now = new Date();
      const timeRemaining = Math.max(
        0,
        expose.expiresAt.getTime() - now.getTime()
      );
      const netVotes = expose.upvotes - expose.downvotes;

      return {
        ...expose,
        timeRemaining,
        netVotes,
        // Include metrics in response
        commentCount: expose.commentCount || 0,
        views: expose.views || 0,
        shareCount: expose.shareCount || 0,
        // Convert MongoDB ObjectId to string
        _id: expose._id.toString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        exposes: exposesWithMetadata,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
}

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

    const { title, description, hashtag, imageUrls = [], audioUrl } = body;

    // Validate required fields
    if (!title || !description || !hashtag) {
      return createErrorResponse(
        "Title, description, and hashtag are required",
        400,
        "MISSING_REQUIRED_FIELDS",
        {
          missing: [
            !title && "title",
            !description && "description",
            !hashtag && "hashtag",
          ].filter(Boolean),
        }
      );
    }

    // Validate field types
    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof hashtag !== "string"
    ) {
      return createErrorResponse(
        "Title, description, and hashtag must be strings",
        400,
        "INVALID_FIELD_TYPES"
      );
    }

    // Validate title length
    if (title.trim().length === 0) {
      return createErrorResponse("Title cannot be empty", 400, "EMPTY_TITLE");
    }

    if (title.length > 200) {
      return createErrorResponse(
        "Title must be 200 characters or less",
        400,
        "TITLE_TOO_LONG",
        { maxLength: 200, currentLength: title.length }
      );
    }

    // Validate description length
    if (description.trim().length === 0) {
      return createErrorResponse(
        "Description cannot be empty",
        400,
        "EMPTY_DESCRIPTION"
      );
    }

    if (description.length > 2000) {
      return createErrorResponse(
        "Description must be 2000 characters or less",
        400,
        "DESCRIPTION_TOO_LONG",
        { maxLength: 2000, currentLength: description.length }
      );
    }

    // Validate hashtag format
    const trimmedHashtag = hashtag.trim();
    if (!trimmedHashtag.startsWith("#")) {
      return createErrorResponse(
        "Hashtag must start with #",
        400,
        "INVALID_HASHTAG_FORMAT"
      );
    }

    if (trimmedHashtag.length < 2 || trimmedHashtag.length > 50) {
      return createErrorResponse(
        "Hashtag must be between 2-50 characters",
        400,
        "INVALID_HASHTAG_LENGTH",
        { minLength: 2, maxLength: 50, currentLength: trimmedHashtag.length }
      );
    }

    // Validate hashtag contains only allowed characters
    const hashtagRegex = /^#[a-zA-Z0-9_]+$/;
    if (!hashtagRegex.test(trimmedHashtag)) {
      return createErrorResponse(
        "Hashtag can only contain letters, numbers, and underscores",
        400,
        "INVALID_HASHTAG_CHARACTERS"
      );
    }

    // Validate image URLs array
    if (!Array.isArray(imageUrls)) {
      return createErrorResponse(
        "Image URLs must be an array",
        400,
        "INVALID_IMAGE_URLS_TYPE"
      );
    }

    if (imageUrls.length > 5) {
      return createErrorResponse(
        "Maximum 5 images allowed",
        400,
        "TOO_MANY_IMAGES",
        { maxImages: 5, currentCount: imageUrls.length }
      );
    }

    // Validate URL formats - accept both relative paths (/uploads/expose-corner/...) and full URLs (http://... or https://...)
    const urlRegex =
      /^(https?:\/\/.+|\/uploads\/expose-corner\/(images|audio)\/.+)$/;
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      if (typeof url !== "string" || !urlRegex.test(url)) {
        return createErrorResponse(
          `Invalid image URL format at index ${i}`,
          400,
          "INVALID_IMAGE_URL",
          { index: i, url }
        );
      }
    }

    if (audioUrl) {
      if (typeof audioUrl !== "string" || !urlRegex.test(audioUrl)) {
        return createErrorResponse(
          "Invalid audio URL format",
          400,
          "INVALID_AUDIO_URL",
          { url: audioUrl }
        );
      }
    }

    // Create new expose with initialized metric fields
    const newExpose = new Expose({
      title: title.trim(),
      description: description.trim(),
      hashtag: trimmedHashtag,
      imageUrls,
      audioUrl: audioUrl || undefined,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      views: 0,
      shareCount: 0,
    });

    const savedExpose = await newExpose.save();

    // Return the created expose with metadata
    const now = new Date();
    const timeRemaining = Math.max(
      0,
      savedExpose.expiresAt.getTime() - now.getTime()
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...savedExpose.toObject(),
          timeRemaining,
          netVotes: 0,
          // Include initialized metrics in response
          commentCount: 0,
          views: 0,
          shareCount: 0,
          _id: savedExpose._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
}
