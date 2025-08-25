import { NextRequest, NextResponse } from "next/server";
import {
  performTestCleanup,
  getCleanupStats,
} from "@/lib/utils/cleanupScheduler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testExpirationMinutes = 1 } = body;

    // Perform test cleanup
    const result = await performTestCleanup(testExpirationMinutes);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Test cleanup completed: ${result.cleanedCount} exposes cleaned, ${result.filesDeleted} files deleted`
        : `Test cleanup failed: ${result.error}`,
      data: {
        cleanedCount: result.cleanedCount,
        filesDeleted: result.filesDeleted,
        testExpirationMinutes,
      },
    });
  } catch (error) {
    console.error("Test cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform test cleanup",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await getCleanupStats();

    return NextResponse.json({
      success: true,
      message: "Cleanup statistics retrieved",
      data: {
        ...stats,
        cleanupSchedulerEnabled:
          process.env.NODE_ENV === "production" ||
          process.env.ENABLE_CLEANUP_SCHEDULER === "true",
      },
    });
  } catch (error) {
    console.error("Error getting cleanup stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get cleanup statistics",
      },
      { status: 500 }
    );
  }
}
