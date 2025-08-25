#!/usr/bin/env node

/**
 * Database optimization script for CaptainSmart
 * This script ensures all required indexes are created and optimizes database performance
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import {
  DatabasePerformanceUtils,
  ExposeQueryOptimizer,
  CommentQueryOptimizer,
  ViewTrackingOptimizer,
} from "../lib/utils/database-optimization.js";

// Load environment variables
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  process.exit(1);
}

async function connectToDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

async function optimizeDatabase() {
  try {
    console.log("\n🚀 Starting database optimization...\n");

    // 1. Ensure all indexes exist
    console.log("📊 Ensuring database indexes...");
    await DatabasePerformanceUtils.ensureIndexes();
    console.log("✅ All indexes ensured successfully\n");

    // 2. Get performance statistics before optimization
    console.log("📈 Getting performance statistics...");
    const statsBefore = await DatabasePerformanceUtils.getPerformanceStats();
    console.log("📊 Performance stats (before optimization):");
    console.table(statsBefore);

    // 3. Run database optimization
    console.log("\n🔧 Running database optimization...");
    const optimizationResults =
      await DatabasePerformanceUtils.optimizeDatabase();
    console.log("✅ Database optimization completed:");
    console.log(
      `   - Expired exposes cleaned: ${optimizationResults.expiredExposes}`
    );
    console.log(`   - Old views cleaned: ${optimizationResults.cleanedViews}`);
    console.log(
      `   - Expose counts updated: ${optimizationResults.updatedExposes}`
    );

    // 4. Get performance statistics after optimization
    console.log("\n📈 Getting updated performance statistics...");
    const statsAfter = await DatabasePerformanceUtils.getPerformanceStats();
    console.log("📊 Performance stats (after optimization):");
    console.table(statsAfter);

    // 5. Test query performance
    console.log("\n⚡ Testing query performance...");
    await testQueryPerformance();

    console.log("\n🎉 Database optimization completed successfully!");
  } catch (error) {
    console.error("❌ Database optimization failed:", error.message);
    throw error;
  }
}

async function testQueryPerformance() {
  const tests = [
    {
      name: "Expose Query (Trending)",
      test: async () => {
        const start = Date.now();
        await ExposeQueryOptimizer.getExposes({
          limit: 10,
          offset: 0,
          sort: "trending",
        });
        return Date.now() - start;
      },
    },
    {
      name: "Expose Query (Popular)",
      test: async () => {
        const start = Date.now();
        await ExposeQueryOptimizer.getExposes({
          limit: 10,
          offset: 0,
          sort: "popular",
        });
        return Date.now() - start;
      },
    },
    {
      name: "Comment Query",
      test: async () => {
        const start = Date.now();
        // Get a sample expose ID for testing
        const exposes = await ExposeQueryOptimizer.getExposes({
          limit: 1,
          offset: 0,
        });
        if (exposes.exposes.length > 0) {
          await CommentQueryOptimizer.getComments({
            exposeId: exposes.exposes[0].exposeId,
            limit: 10,
            offset: 0,
          });
        }
        return Date.now() - start;
      },
    },
    {
      name: "View Analytics",
      test: async () => {
        const start = Date.now();
        // Get a sample expose ID for testing
        const exposes = await ExposeQueryOptimizer.getExposes({
          limit: 1,
          offset: 0,
        });
        if (exposes.exposes.length > 0) {
          await ViewTrackingOptimizer.getViewAnalytics(
            exposes.exposes[0].exposeId,
            7
          );
        }
        return Date.now() - start;
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const duration = await test.test();
      results.push({
        Test: test.name,
        "Duration (ms)": duration,
        Status:
          duration < 100
            ? "🟢 Fast"
            : duration < 500
              ? "🟡 Moderate"
              : "🔴 Slow",
      });
    } catch (error) {
      results.push({
        Test: test.name,
        "Duration (ms)": "Error",
        Status: "❌ Failed",
      });
      console.warn(`⚠️  Test "${test.name}" failed:`, error.message);
    }
  }

  console.table(results);
}

async function generateOptimizationReport() {
  try {
    console.log("\n📋 Generating optimization report...\n");

    const stats = await DatabasePerformanceUtils.getPerformanceStats();

    const report = {
      timestamp: new Date().toISOString(),
      collections: {
        exposes: {
          documents: stats.expose.count,
          avgSize: Math.round(stats.expose.avgObjSize || 0),
          totalSize:
            Math.round(((stats.expose.size || 0) / 1024 / 1024) * 100) / 100, // MB
          indexes: stats.expose.indexes,
        },
        comments: {
          documents: stats.comment.count,
          avgSize: Math.round(stats.comment.avgObjSize || 0),
          totalSize:
            Math.round(((stats.comment.size || 0) / 1024 / 1024) * 100) / 100, // MB
          indexes: stats.comment.indexes,
        },
        viewTracking: {
          documents: stats.viewTracking.count,
          avgSize: Math.round(stats.viewTracking.avgObjSize || 0),
          totalSize:
            Math.round(((stats.viewTracking.size || 0) / 1024 / 1024) * 100) /
            100, // MB
          indexes: stats.viewTracking.indexes,
        },
      },
      recommendations: [],
    };

    // Add recommendations based on stats
    if (stats.expose.count > 10000 && stats.expose.indexes < 5) {
      report.recommendations.push(
        "Consider adding more indexes for expose collection as document count is high"
      );
    }

    if (stats.comment.count > 50000 && stats.comment.indexes < 4) {
      report.recommendations.push(
        "Consider adding more indexes for comment collection as document count is high"
      );
    }

    if (stats.viewTracking.count > 100000) {
      report.recommendations.push(
        "Consider implementing more aggressive TTL for view tracking as document count is very high"
      );
    }

    const totalSize =
      report.collections.exposes.totalSize +
      report.collections.comments.totalSize +
      report.collections.viewTracking.totalSize;

    if (totalSize > 1000) {
      // > 1GB
      report.recommendations.push(
        "Database size is large. Consider archiving old data or implementing data retention policies"
      );
    }

    console.log("📊 Database Optimization Report");
    console.log("================================");
    console.log(`Generated: ${report.timestamp}`);
    console.log(`Total Size: ${totalSize.toFixed(2)} MB\n`);

    console.log("Collection Statistics:");
    console.table(report.collections);

    if (report.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    } else {
      console.log("\n✅ No optimization recommendations at this time.");
    }

    return report;
  } catch (error) {
    console.error("❌ Failed to generate optimization report:", error.message);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await optimizeDatabase();
    await generateOptimizationReport();
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Handle script termination
process.on("SIGINT", async () => {
  console.log("\n⚠️  Script interrupted. Cleaning up...");
  await mongoose.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⚠️  Script terminated. Cleaning up...");
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
