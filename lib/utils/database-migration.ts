import { connectToDatabase } from "@/utils/mongodb";
import { Expose } from "@/databaseModels/exposeModel";

/**
 * Migration utility to add new fields to existing expose documents
 */
export class DatabaseMigration {
  /**
   * Add comment count, views, and share count fields to existing exposes
   */
  static async migrateExposeMetrics(): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      await connectToDatabase();

      // Update all existing exposes that don't have the new fields
      const result = await Expose.updateMany(
        {
          $or: [
            { commentCount: { $exists: false } },
            { views: { $exists: false } },
            { shareCount: { $exists: false } },
          ],
        },
        {
          $set: {
            commentCount: 0,
            views: 0,
            shareCount: 0,
          },
        }
      );

      updated = result.modifiedCount;

      console.log(`Migration completed: Updated ${updated} expose documents`);

      return {
        success: true,
        updated,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);
      console.error("Migration failed:", errorMessage);

      return {
        success: false,
        updated,
        errors,
      };
    }
  }

  /**
   * Recalculate comment counts for all exposes based on actual comments
   */
  static async recalculateCommentCounts(): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      await connectToDatabase();

      // Import Comment model dynamically to avoid circular dependencies
      const { Comment } = await import("@/databaseModels/commentModel");

      // Get comment counts for each expose
      const commentCounts = await Comment.aggregate([
        {
          $group: {
            _id: "$exposeId",
            count: { $sum: 1 },
          },
        },
      ]);

      // Update each expose with the correct comment count
      for (const { _id: exposeId, count } of commentCounts) {
        await Expose.updateOne({ exposeId }, { $set: { commentCount: count } });
        updated++;
      }

      // Set comment count to 0 for exposes with no comments
      await Expose.updateMany(
        {
          exposeId: {
            $nin: commentCounts.map((cc) => cc._id),
          },
        },
        { $set: { commentCount: 0 } }
      );

      console.log(
        `Comment count recalculation completed: Updated ${updated} exposes`
      );

      return {
        success: true,
        updated,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);
      console.error("Comment count recalculation failed:", errorMessage);

      return {
        success: false,
        updated,
        errors,
      };
    }
  }

  /**
   * Recalculate view counts for all exposes based on view tracking data
   */
  static async recalculateViewCounts(): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      await connectToDatabase();

      // Import ViewTracking model dynamically to avoid circular dependencies
      const { ViewTracking } = await import(
        "@/databaseModels/viewTrackingModel"
      );

      // Get view counts for each expose
      const viewCounts = await ViewTracking.aggregate([
        {
          $group: {
            _id: "$exposeId",
            count: { $sum: 1 },
          },
        },
      ]);

      // Update each expose with the correct view count
      for (const { _id: exposeId, count } of viewCounts) {
        await Expose.updateOne({ exposeId }, { $set: { views: count } });
        updated++;
      }

      // Set view count to 0 for exposes with no views
      await Expose.updateMany(
        {
          exposeId: {
            $nin: viewCounts.map((vc) => vc._id),
          },
        },
        { $set: { views: 0 } }
      );

      console.log(
        `View count recalculation completed: Updated ${updated} exposes`
      );

      return {
        success: true,
        updated,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);
      console.error("View count recalculation failed:", errorMessage);

      return {
        success: false,
        updated,
        errors,
      };
    }
  }

  /**
   * Run all migrations
   */
  static async runAllMigrations(): Promise<{
    success: boolean;
    results: Record<string, any>;
    errors: string[];
  }> {
    const results: Record<string, any> = {};
    const allErrors: string[] = [];

    console.log("Starting database migrations...");

    // Run expose metrics migration
    const metricsResult = await this.migrateExposeMetrics();
    results.exposeMetrics = metricsResult;
    allErrors.push(...metricsResult.errors);

    // Run comment count recalculation
    const commentResult = await this.recalculateCommentCounts();
    results.commentCounts = commentResult;
    allErrors.push(...commentResult.errors);

    // Run view count recalculation
    const viewResult = await this.recalculateViewCounts();
    results.viewCounts = viewResult;
    allErrors.push(...viewResult.errors);

    const success = allErrors.length === 0;

    console.log("Database migrations completed:", {
      success,
      totalErrors: allErrors.length,
    });

    return {
      success,
      results,
      errors: allErrors,
    };
  }
}

// Export a convenience function for running migrations
export async function runDatabaseMigrations() {
  return DatabaseMigration.runAllMigrations();
}
