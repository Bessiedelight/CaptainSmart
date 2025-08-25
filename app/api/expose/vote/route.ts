import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/mongodb";
import { Expose } from "@/databaseModels/exposeModel";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { exposeId, voteType } = body;

    // Validate required fields
    if (!exposeId || !voteType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: exposeId and voteType",
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

    // Validate voteType
    if (!["upvote", "downvote"].includes(voteType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vote type. Must be 'upvote' or 'downvote'",
          code: "INVALID_VOTE_TYPE",
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

    // Prepare update operation
    const updateOperation =
      voteType === "upvote"
        ? { $inc: { upvotes: 1 } }
        : { $inc: { downvotes: 1 } };

    // Atomically increment the vote count
    const updatedExpose = await Expose.findOneAndUpdate(
      { exposeId, expiresAt: { $gt: new Date() } },
      updateOperation,
      { new: true }
    );

    if (!updatedExpose) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update vote count - expose may have been deleted",
          code: "UPDATE_FAILED",
        },
        { status: 500 }
      );
    }

    // Calculate net votes
    const netVotes =
      (updatedExpose.upvotes || 0) - (updatedExpose.downvotes || 0);

    return NextResponse.json({
      success: true,
      message: `${voteType} recorded successfully`,
      data: {
        upvotes: updatedExpose.upvotes || 0,
        downvotes: updatedExpose.downvotes || 0,
        netVotes,
      },
    });
  } catch (error: any) {
    console.error("Error recording vote:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while recording vote",
        code: "INTERNAL_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
