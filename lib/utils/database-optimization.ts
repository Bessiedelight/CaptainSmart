import { Expose } from "@/databaseModels/exposeModel";
import { Comment } from "@/databaseModels/commentModel";
import { ViewTracking } from "@/databaseModels/viewTrackingModel";

/**
 * Database optimization utilities for improved query performance
 */

export interface PaginationOptions {
  limit: number;
  offset: number;
  sort?: string;
}

export interface ExposeQueryOptions extends PaginationOptions {
  hashtag?: string;
  includeExpired?: boolean;
  minViews?: number;
  minComments?: number;
}

export interface CommentQueryOptions extends PaginationOptions {
  exposeId: string;
  anonymousId?: string;
}

/**
 * Optimized expose queries with proper indexing and aggregation
 */
export class ExposeQueryOptimizer {
  /**
   * Get exposes with optimized pagination and sorting
   */
  static async getExposes(options: ExposeQueryOptions) {
    const {
      limit = 10,
      offset = 0,
      sort = "newest",
      hashtag,
      includeExpired = false,
      minViews = 0,
      minComments = 0,
    } = options;

    // Build match conditions
    const matchConditions: any = {};

    if (!includeExpired) {
      matchConditions.expiresAt = { $gt: new Date() };
    }

    if (hashtag) {
      matchConditions.hashtag = hashtag;
    }

    if (minViews > 0) {
      matchConditions.views = { $gte: minViews };
    }

    if (minComments > 0) {
      matchConditions.commentCount = { $gte: minComments };
    }

    // Build sort conditions
    let sortConditions: any = {};
    switch (sort) {
      case "trending":
        // Complex trending algorithm considering multiple factors
        sortConditions = {
          trendingScore: -1,
          createdAt: -1,
        };
        break;
      case "popular":
        sortConditions = {
          views: -1,
          commentCount: -1,
          upvotes: -1,
        };
        break;
      case "discussed":
        sortConditions = {
          commentCount: -1,
          views: -1,
        };
        break;
      case "newest":
      default:
        sortConditions = { createdAt: -1 };
        break;
    }

    // Use aggregation pipeline for complex sorting like trending
    if (sort === "trending") {
      const pipeline = [
        { $match: matchConditions },
        {
          $addFields: {
            // Calculate trending score based on engagement and recency
            trendingScore: {
              $add: [
                // Engagement score (views + comments * 5 + upvotes * 3 - downvotes)
                {
                  $add: [
                    "$views",
                    { $multiply: ["$commentCount", 5] },
                    { $multiply: ["$upvotes", 3] },
                    { $multiply: ["$downvotes", -1] },
                  ],
                },
                // Recency boost (newer posts get higher score)
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            new Date(),
                            { $subtract: [new Date(), "$createdAt"] },
                          ],
                        },
                        1000 * 60 * 60 * 24, // Convert to days
                      ],
                    },
                    100, // Recency multiplier
                  ],
                },
              ],
            },
            // Calculate net votes for display
            netVotes: { $subtract: ["$upvotes", "$downvotes"] },
            // Calculate time remaining
            timeRemaining: {
              $max: [0, { $subtract: ["$expiresAt", new Date()] }],
            },
          },
        },
        { $sort: sortConditions },
        { $skip: offset },
        { $limit: limit },
      ];

      const [exposes, totalCount] = await Promise.all([
        Expose.aggregate(pipeline),
        Expose.countDocuments(matchConditions),
      ]);

      return {
        exposes,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      };
    }

    // For simpler sorts, use regular find with indexes
    const [exposes, totalCount] = await Promise.all([
      Expose.find(matchConditions)
        .sort(sortConditions)
        .skip(offset)
        .limit(limit)
        .lean(), // Use lean() for better performance when we don't need full documents
      Expose.countDocuments(matchConditions),
    ]);

    // Add computed fields for lean documents
    const enhancedExposes = exposes.map((expose) => ({
      ...expose,
      netVotes: expose.upvotes - expose.downvotes,
      timeRemaining: Math.max(0, expose.expiresAt.getTime() - Date.now()),
    }));

    return {
      exposes: enhancedExposes,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  }

  /**
   * Get expose metrics with caching optimization
   */
  static async getExposeMetrics(exposeId: string) {
    // Use aggregation to get all metrics in a single query
    const [exposeMetrics, commentCount, viewCount] = await Promise.all([
      Expose.findOne(
        { exposeId },
        {
          upvotes: 1,
          downvotes: 1,
          views: 1,
          commentCount: 1,
          shareCount: 1,
        }
      ).lean(),
      Comment.countDocuments({ exposeId }),
      ViewTracking.countDocuments({ exposeId }),
    ]);

    if (!exposeMetrics) {
      throw new Error("Expose not found");
    }

    return {
      upvotes: exposeMetrics.upvotes || 0,
      downvotes: exposeMetrics.downvotes || 0,
      netVotes: (exposeMetrics.upvotes || 0) - (exposeMetrics.downvotes || 0),
      views: Math.max(exposeMetrics.views || 0, viewCount),
      comments: Math.max(exposeMetrics.commentCount || 0, commentCount),
      shares: exposeMetrics.shareCount || 0,
    };
  }

  /**
   * Batch update metrics for multiple exposes
   */
  static async batchUpdateMetrics(exposeIds: string[]) {
    const operations = exposeIds.map((exposeId) => ({
      updateOne: {
        filter: { exposeId },
        update: [
          {
            $set: {
              commentCount: {
                $ifNull: [
                  {
                    $size: {
                      $filter: {
                        input: "$comments",
                        cond: { $eq: ["$$this.exposeId", exposeId] },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
        ],
      },
    }));

    return Expose.bulkWrite(operations);
  }
}

/**
 * Optimized comment queries with proper indexing
 */
export class CommentQueryOptimizer {
  /**
   * Get comments with optimized pagination and lazy loading
   */
  static async getComments(options: CommentQueryOptions) {
    const {
      exposeId,
      limit = 10,
      offset = 0,
      sort = "newest",
      anonymousId,
    } = options;

    // Build match conditions
    const matchConditions: any = { exposeId };

    if (anonymousId) {
      matchConditions.anonymousId = anonymousId;
    }

    // Build sort conditions
    const sortConditions: any = {};
    switch (sort) {
      case "oldest":
        sortConditions.createdAt = 1;
        break;
      case "newest":
      default:
        sortConditions.createdAt = -1;
        break;
    }

    // Use aggregation for better performance with virtual fields
    const pipeline = [
      { $match: matchConditions },
      {
        $addFields: {
          timeAgo: {
            $let: {
              vars: {
                diffMs: { $subtract: [new Date(), "$createdAt"] },
              },
              in: {
                $switch: {
                  branches: [
                    {
                      case: { $lt: ["$$diffMs", 60000] }, // Less than 1 minute
                      then: "now",
                    },
                    {
                      case: { $lt: ["$$diffMs", 3600000] }, // Less than 1 hour
                      then: {
                        $concat: [
                          {
                            $toString: {
                              $floor: { $divide: ["$$diffMs", 60000] },
                            },
                          },
                          "m",
                        ],
                      },
                    },
                    {
                      case: { $lt: ["$$diffMs", 86400000] }, // Less than 1 day
                      then: {
                        $concat: [
                          {
                            $toString: {
                              $floor: { $divide: ["$$diffMs", 3600000] },
                            },
                          },
                          "h",
                        ],
                      },
                    },
                    {
                      case: { $lt: ["$$diffMs", 604800000] }, // Less than 1 week
                      then: {
                        $concat: [
                          {
                            $toString: {
                              $floor: { $divide: ["$$diffMs", 86400000] },
                            },
                          },
                          "d",
                        ],
                      },
                    },
                  ],
                  default: {
                    $dateToString: {
                      format: "%b %d",
                      date: "$createdAt",
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $sort: sortConditions },
      { $skip: offset },
      { $limit: limit },
    ];

    const [comments, totalCount] = await Promise.all([
      Comment.aggregate(pipeline),
      Comment.countDocuments(matchConditions),
    ]);

    return {
      comments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  }

  /**
   * Get comment statistics for an expose
   */
  static async getCommentStats(exposeId: string) {
    const stats = await Comment.aggregate([
      { $match: { exposeId } },
      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 },
          uniqueUsers: { $addToSet: "$anonymousId" },
          avgLength: { $avg: { $strLenCP: "$content" } },
          recentComments: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalComments: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          avgLength: { $round: ["$avgLength", 1] },
          recentComments: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalComments: 0,
        uniqueUsers: 0,
        avgLength: 0,
        recentComments: 0,
      }
    );
  }
}

/**
 * View tracking optimization utilities
 */
export class ViewTrackingOptimizer {
  /**
   * Batch process view tracking for better performance
   */
  static async batchTrackViews(
    views: Array<{
      exposeId: string;
      sessionId: string;
      ipHash: string;
      userAgent: string;
    }>
  ) {
    // Use insertMany with ordered: false for better performance
    try {
      const result = await ViewTracking.insertMany(views, {
        ordered: false, // Continue inserting even if some fail (duplicates)
      });
      return result.length;
    } catch (error: any) {
      // Handle bulk write errors (mostly duplicate key errors)
      if (error.writeErrors) {
        const successfulInserts = views.length - error.writeErrors.length;
        return successfulInserts;
      }
      throw error;
    }
  }

  /**
   * Get view analytics with aggregation
   */
  static async getViewAnalytics(exposeId: string, days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const analytics = await ViewTracking.aggregate([
      {
        $match: {
          exposeId,
          viewedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$viewedAt",
              },
            },
          },
          totalViews: { $sum: 1 },
          uniqueViews: { $addToSet: "$ipHash" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          totalViews: 1,
          uniqueViews: { $size: "$uniqueViews" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return analytics;
  }

  /**
   * Clean up old view tracking data
   */
  static async cleanupOldViews(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await ViewTracking.deleteMany({
      viewedAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  }
}

/**
 * General database performance utilities
 */
export class DatabasePerformanceUtils {
  /**
   * Ensure all required indexes exist
   */
  static async ensureIndexes() {
    try {
      // Ensure Expose indexes
      await Expose.collection.createIndex({ hashtag: 1 });
      await Expose.collection.createIndex({ createdAt: -1 });
      await Expose.collection.createIndex({
        views: -1,
        commentCount: -1,
        upvotes: -1,
      });
      await Expose.collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      );

      // Ensure Comment indexes
      await Comment.collection.createIndex({ exposeId: 1, createdAt: -1 });
      await Comment.collection.createIndex({ anonymousId: 1 });
      await Comment.collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 7776000 }
      );

      // Ensure ViewTracking indexes
      await ViewTracking.collection.createIndex({ exposeId: 1 });
      await ViewTracking.collection.createIndex(
        { sessionId: 1, exposeId: 1 },
        { unique: true }
      );
      await ViewTracking.collection.createIndex(
        { viewedAt: 1 },
        { expireAfterSeconds: 2592000 }
      );

      console.log("All database indexes ensured successfully");
    } catch (error) {
      console.error("Error ensuring database indexes:", error);
      throw error;
    }
  }

  /**
   * Get database performance statistics
   */
  static async getPerformanceStats() {
    try {
      const [exposeStats, commentStats, viewStats] = await Promise.all([
        Expose.collection.stats(),
        Comment.collection.stats(),
        ViewTracking.collection.stats(),
      ]);

      return {
        expose: {
          count: exposeStats.count,
          size: exposeStats.size,
          avgObjSize: exposeStats.avgObjSize,
          indexes: exposeStats.nindexes,
        },
        comment: {
          count: commentStats.count,
          size: commentStats.size,
          avgObjSize: commentStats.avgObjSize,
          indexes: commentStats.nindexes,
        },
        viewTracking: {
          count: viewStats.count,
          size: viewStats.size,
          avgObjSize: viewStats.avgObjSize,
          indexes: viewStats.nindexes,
        },
      };
    } catch (error) {
      console.error("Error getting performance stats:", error);
      throw error;
    }
  }

  /**
   * Optimize database by running maintenance operations
   */
  static async optimizeDatabase() {
    try {
      // Clean up expired documents that might not have been auto-deleted
      const expiredExposes = await Expose.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      // Clean up old view tracking data
      const cleanedViews = await ViewTrackingOptimizer.cleanupOldViews(30);

      // Update any inconsistent comment counts
      const exposes = await Expose.find(
        {},
        { exposeId: 1, commentCount: 1 }
      ).lean();
      const updateOperations = [];

      for (const expose of exposes) {
        const actualCommentCount = await Comment.countDocuments({
          exposeId: expose.exposeId,
        });

        if (actualCommentCount !== expose.commentCount) {
          updateOperations.push({
            updateOne: {
              filter: { exposeId: expose.exposeId },
              update: { $set: { commentCount: actualCommentCount } },
            },
          });
        }
      }

      let updatedExposes = 0;
      if (updateOperations.length > 0) {
        const result = await Expose.bulkWrite(updateOperations);
        updatedExposes = result.modifiedCount;
      }

      return {
        expiredExposes: expiredExposes.deletedCount,
        cleanedViews,
        updatedExposes,
      };
    } catch (error) {
      console.error("Error optimizing database:", error);
      throw error;
    }
  }
}
