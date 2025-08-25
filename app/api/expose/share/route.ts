import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/mongodb";
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
          code: "MISSING_EXPOSE_ID",
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

    // Atomically increment the share count
    const updatedExpose = await Expose.findOneAndUpdate(
      { exposeId, expiresAt: { $gt: new Date() } },
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!updatedExpose) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update share count - expose may have been deleted",
          code: "UPDATE_FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Share recorded successfully",
      data: {
        shareCount: updatedExpose.shareCount || 0,
      },
    });
  } catch (error: any) {
    console.error("Error recording share:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while recording share",
        code: "INTERNAL_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
