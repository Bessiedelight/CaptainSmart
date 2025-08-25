import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/mongodb";
import {
  ViewTracking,
  ViewTrackingUtils,
} from "@/databaseModels/viewTrackingModel";
import { Expose } from "@/databaseModels/exposeModel";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { exposeId } = body;

    // Validate required fields
    if (!exposeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: exposeId",
          code: "MISSING_FIELDS",
        },
        { status: 400 }
      );
    }

    // Validate exposeId format
    if (!exposeId.startsWith("expose_")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid expose ID format",
          code: "INVALID_EXPOSE_ID",
        },
        { status: 400 }
      );
    }

    // Generate session ID from client information for consistency
    const clientIP =
      request.ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create a consistent session ID based on IP and user agent
    const sessionData = `${clientIP}_${userAgent}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionData);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const sessionId = `session_${hashHex.substring(0, 32)}`;

    // Check if the expose exists and is not expired
    const expose = await Expose.findOne({
      exposeId,
      expiresAt: { $gt: new Date() },
    });

    if (!expose) {
      return NextResponse.json(
        {
          success: false,
          error: "Expose not found or has expired",
          code: "EXPOSE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Hash the IP for privacy
    const ipHash = ViewTrackingUtils.hashIP(clientIP);

    // Check if this session has already viewed this expose
    const hasAlreadyViewed = await ViewTracking.hasViewed(exposeId, sessionId);

    if (hasAlreadyViewed) {
      // Return success but indicate no new view was recorded
      return NextResponse.json({
        success: true,
        message: "View already recorded for this session",
        newView: false,
        viewCount: expose.views,
      });
    }

    // Record the view in the tracking collection
    const viewRecorded = await ViewTracking.recordView(
      exposeId,
      sessionId,
      ipHash,
      userAgent
    );

    if (!viewRecorded) {
      // This shouldn't happen if hasViewed check worked correctly
      return NextResponse.json({
        success: true,
        message: "View already recorded",
        newView: false,
        viewCount: expose.views,
      });
    }

    // Atomically increment the view count in the expose document
    const updatedExpose = await Expose.incrementViews(exposeId);

    if (!updatedExpose) {
      // This could happen if the expose was deleted between checks
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update view count - expose may have been deleted",
          code: "UPDATE_FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "View recorded successfully",
      newView: true,
      viewCount: updatedExpose.views,
    });
  } catch (error: any) {
    console.error("Error recording view:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error - view already recorded
      return NextResponse.json({
        success: true,
        message: "View already recorded",
        newView: false,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while recording view",
        code: "INTERNAL_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
