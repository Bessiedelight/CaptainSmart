import cron from "node-cron";
import { connectToDatabase } from "@/utils/mongodb";
import { Expose } from "@/databaseModels/exposeModel";
import { cleanupExpiredFiles } from "./fileUpload";

let cleanupJobStarted = false;

export function startCleanupScheduler() {
  if (cleanupJobStarted) {
    console.log("Cleanup scheduler already running");
    return;
  }

  // Run cleanup every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Starting scheduled cleanup of expired exposes...");
    await performCleanup();
  });

  // Also run cleanup every 6 hours as a backup
  cron.schedule("0 */6 * * *", async () => {
    console.log("Starting backup cleanup of expired exposes...");
    await performCleanup();
  });

  cleanupJobStarted = true;
  console.log("Expose cleanup scheduler started - running every hour");
}

export async function performCleanup(): Promise<{
  success: boolean;
  cleanedCount: number;
  filesDeleted: number;
  error?: string;
}> {
  try {
    await connectToDatabase();

    // Find all expired exposes
    const expiredExposes = await Expose.find({
      expiresAt: { $lte: new Date() },
    }).lean();

    if (expiredExposes.length === 0) {
      console.log("No expired exposes found during cleanup");
      return {
        success: true,
        cleanedCount: 0,
        filesDeleted: 0,
      };
    }

    console.log(`Found ${expiredExposes.length} expired exposes to clean up`);

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
          console.log(
            `Cleaned up ${filesToDelete.length} files for expose ${expose.exposeId}`
          );
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

    return {
      success: true,
      cleanedCount: deleteResult.deletedCount,
      filesDeleted,
    };
  } catch (error) {
    console.error("Scheduled cleanup error:", error);
    return {
      success: false,
      cleanedCount: 0,
      filesDeleted: 0,
      error: error instanceof Error ? error.message : "Unknown cleanup error",
    };
  }
}

// Manual cleanup function for testing
export async function performTestCleanup(
  testExpirationMinutes: number = 1
): Promise<{
  success: boolean;
  cleanedCount: number;
  filesDeleted: number;
  error?: string;
}> {
  try {
    await connectToDatabase();

    // For testing, find exposes that would expire within the test timeframe
    const testExpires = new Date(
      Date.now() + testExpirationMinutes * 60 * 1000
    );

    // Update expiration time for testing
    const updateResult = await Expose.updateMany(
      { expiresAt: { $lte: testExpires } },
      { expiresAt: new Date(Date.now() - 1000) } // Set to 1 second ago
    );

    console.log(
      `Updated ${updateResult.modifiedCount} exposes for test cleanup`
    );

    // Now perform regular cleanup
    return await performCleanup();
  } catch (error) {
    console.error("Test cleanup error:", error);
    return {
      success: false,
      cleanedCount: 0,
      filesDeleted: 0,
      error:
        error instanceof Error ? error.message : "Unknown test cleanup error",
    };
  }
}

// Get cleanup statistics
export async function getCleanupStats(): Promise<{
  totalExposes: number;
  expiredExposes: number;
  expiringSoon: number; // Within next 24 hours
  oldestExpire: Date | null;
  newestExpire: Date | null;
}> {
  try {
    await connectToDatabase();

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalExposes,
      expiredExposes,
      expiringSoon,
      oldestExpose,
      newestExpose,
    ] = await Promise.all([
      Expose.countDocuments({}),
      Expose.countDocuments({ expiresAt: { $lte: now } }),
      Expose.countDocuments({
        expiresAt: { $gt: now, $lte: in24Hours },
      }),
      Expose.findOne({}, {}, { sort: { expiresAt: 1 } }),
      Expose.findOne({}, {}, { sort: { expiresAt: -1 } }),
    ]);

    return {
      totalExposes,
      expiredExposes,
      expiringSoon,
      oldestExpire: oldestExpose?.expiresAt || null,
      newestExpire: newestExpose?.expiresAt || null,
    };
  } catch (error) {
    console.error("Error getting cleanup stats:", error);
    return {
      totalExposes: 0,
      expiredExposes: 0,
      expiringSoon: 0,
      oldestExpire: null,
      newestExpire: null,
    };
  }
}
