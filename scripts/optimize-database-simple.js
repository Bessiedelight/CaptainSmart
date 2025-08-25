#!/usr/bin/env node

/**
 * Simple database optimization script for CaptainSmart
 * This script ensures all required indexes are created
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

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

async function ensureIndexes() {
  try {
    console.log("\n📊 Ensuring database indexes...\n");

    const db = mongoose.connection.db;

    // Ensure Expose collection indexes
    console.log("Creating indexes for exposes collection...");
    const exposesCollection = db.collection("exposes");

    await exposesCollection.createIndex({ hashtag: 1 });
    await exposesCollection.createIndex({ createdAt: -1 });
    await exposesCollection.createIndex({ upvotes: -1, downvotes: 1 });
    await exposesCollection.createIndex({ expiresAt: 1, createdAt: -1 });
    await exposesCollection.createIndex({ views: -1 });
    await exposesCollection.createIndex({ commentCount: -1 });
    await exposesCollection.createIndex({
      views: -1,
      commentCount: -1,
      upvotes: -1,
    });
    await exposesCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    console.log("✅ Expose indexes created");

    // Ensure Comment collection indexes
    console.log("Creating indexes for comments collection...");
    const commentsCollection = db.collection("comments");

    await commentsCollection.createIndex({ exposeId: 1, createdAt: -1 });
    await commentsCollection.createIndex({ anonymousId: 1 });
    await commentsCollection.createIndex({ ipHash: 1, createdAt: -1 });
    await commentsCollection.createIndex({ createdAt: -1 });
    await commentsCollection.createIndex({ exposeId: 1, anonymousId: 1 });
    await commentsCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7776000 }
    ); // 90 days

    console.log("✅ Comment indexes created");

    // Ensure ViewTracking collection indexes
    console.log("Creating indexes for viewTracking collection...");
    const viewTrackingCollection = db.collection("viewTracking");

    await viewTrackingCollection.createIndex({ exposeId: 1 });
    await viewTrackingCollection.createIndex(
      { sessionId: 1, exposeId: 1 },
      { unique: true }
    );
    await viewTrackingCollection.createIndex({ ipHash: 1, exposeId: 1 });
    await viewTrackingCollection.createIndex({ viewedAt: 1 });
    await viewTrackingCollection.createIndex(
      { viewedAt: 1 },
      { expireAfterSeconds: 2592000 }
    ); // 30 days

    console.log("✅ ViewTracking indexes created");

    console.log("\n🎉 All database indexes ensured successfully!");
  } catch (error) {
    console.error("❌ Error ensuring database indexes:", error.message);
    throw error;
  }
}

async function getCollectionStats() {
  try {
    console.log("\n📈 Getting collection statistics...\n");

    const db = mongoose.connection.db;

    const collections = ["exposes", "comments", "viewTracking"];
    const stats = {};

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const collectionStats = await collection.stats();
        const count = await collection.countDocuments();

        stats[collectionName] = {
          documents: count,
          size: Math.round((collectionStats.size / 1024 / 1024) * 100) / 100, // MB
          avgObjSize: Math.round(collectionStats.avgObjSize || 0),
          indexes: collectionStats.nindexes || 0,
        };
      } catch (error) {
        // Collection might not exist yet
        stats[collectionName] = {
          documents: 0,
          size: 0,
          avgObjSize: 0,
          indexes: 0,
        };
      }
    }

    console.table(stats);
    return stats;
  } catch (error) {
    console.error("❌ Error getting collection stats:", error.message);
    return {};
  }
}

async function cleanupExpiredData() {
  try {
    console.log("\n🧹 Cleaning up expired data...\n");

    const db = mongoose.connection.db;

    // Clean up expired exposes
    const exposesCollection = db.collection("exposes");
    const expiredExposes = await exposesCollection.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(
      `🗑️  Cleaned up ${expiredExposes.deletedCount} expired exposes`
    );

    // Clean up old view tracking data (older than 30 days)
    const viewTrackingCollection = db.collection("viewTracking");
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldViews = await viewTrackingCollection.deleteMany({
      viewedAt: { $lt: cutoffDate },
    });

    console.log(`🗑️  Cleaned up ${oldViews.deletedCount} old view records`);

    return {
      expiredExposes: expiredExposes.deletedCount,
      oldViews: oldViews.deletedCount,
    };
  } catch (error) {
    console.error("❌ Error cleaning up expired data:", error.message);
    return { expiredExposes: 0, oldViews: 0 };
  }
}

async function main() {
  try {
    await connectToDatabase();

    console.log("\n🚀 Starting database optimization...");

    // Get stats before optimization
    console.log("📊 Statistics before optimization:");
    await getCollectionStats();

    // Ensure all indexes exist
    await ensureIndexes();

    // Clean up expired data
    const cleanupResults = await cleanupExpiredData();

    // Get stats after optimization
    console.log("\n📊 Statistics after optimization:");
    await getCollectionStats();

    console.log("\n✅ Database optimization completed successfully!");
    console.log(
      `   - Expired exposes cleaned: ${cleanupResults.expiredExposes}`
    );
    console.log(`   - Old view records cleaned: ${cleanupResults.oldViews}`);
  } catch (error) {
    console.error("❌ Database optimization failed:", error.message);
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
