import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/mongodb";
import { Expose } from "@/databaseModels/exposeModel";
import { cleanupExpiredFiles } from "@/lib/utils/fileUpload";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Find all expired exposes
    const expiredExposes = await Expose.find({
      expiresAt: { $lte: new Date() },
    }).lean();

    if (expiredExposes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired exposes found",
        data: {
          cleanedCount: 0,
          filesDeleted: 0,
        },
      });
    }

    let filesDeleted = 0;
    const cleanupPromises = expiredExposes.map(async (expose) => {
      try {
        // Clean up associated files
        const filesToDelete = [...expose.imageUrls];
        if (expose.audioUrl) {
          filesToDelete.push(expose.audioUrl);
        }

        if (filesToDelete.length > 0) {
          await cleanupExpiredFiles(expose.imageUrls, expose.audioUrl);
          filesDeleted += filesToDelete.length;
        }
      } catch (fileError) {
        console.error(
          `Error cleaning up files for expose ${expose.exposeId}:`,
          fileError
        );
        // Continue with database cleanup even if file cleanup fails
      }
    });

    // Wait for all file cleanup operations to complete
    await Promise.allSettled(cleanupPromises);

    // Delete expired exposes from database
    const deleteResult = await Expose.deleteMany({
      expiresAt: { $lte: new Date() },
    });

    console.log(
      `Cleanup completed: ${deleteResult.deletedCount} exposes deleted, ${filesDeleted} files removed`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${deleteResult.deletedCount} expired exposes`,
      data: {
        cleanedCount: deleteResult.deletedCount,
        filesDeleted,
      },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform cleanup",
      },
      { status: 500 }
    );
  }
}

// Manual cleanup endpoint for testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get("test") === "true";

    await connectToDatabase();

    if (testMode) {
      // In test mode, find exposes that would expire soon (for testing with shorter timeframes)
      const testExpires = new Date(Date.now() + 60 * 1000); // 1 minute from now
      const soonToExpire = await Expose.find({
        expiresAt: { $lte: testExpires },
      }).lean();

      return NextResponse.json({
        success: true,
        message: "Test mode - showing exposes that would be cleaned up",
        data: {
          expiringSoon: soonToExpire.length,
          exposes: soonToExpire.map((expose) => ({
            exposeId: expose.exposeId,
            title: expose.title,
            expiresAt: expose.expiresAt,
            imageCount: expose.imageUrls.length,
            hasAudio: !!expose.audioUrl,
          })),
        },
      });
    }

    // Regular mode - show current expired exposes
    const expiredExposes = await Expose.find({
      expiresAt: { $lte: new Date() },
    }).lean();

    return NextResponse.json({
      success: true,
      message: "Current expired exposes",
      data: {
        expiredCount: expiredExposes.length,
        exposes: expiredExposes.map((expose) => ({
          exposeId: expose.exposeId,
          title: expose.title,
          expiresAt: expose.expiresAt,
          imageCount: expose.imageUrls.length,
          hasAudio: !!expose.audioUrl,
        })),
      },
    });
  } catch (error) {
    console.error("Cleanup check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check cleanup status",
      },
      { status: 500 }
    );
  }
}
