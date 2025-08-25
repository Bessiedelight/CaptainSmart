/**
 * Database migration script for adding comment and view tracking fields
 * Run with: node scripts/migrate-database.js
 */

const { connectToDatabase } = require("../utils/mongodb");

async function migrateDatabase() {
  try {
    console.log("Starting database migration...");

    // Connect to database
    await connectToDatabase();
    console.log("Connected to database");

    // Import mongoose to run raw queries
    const mongoose = require("mongoose");

    // Add new fields to existing expose documents
    const exposeResult = await mongoose.connection.db
      .collection("exposes")
      .updateMany(
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

    console.log(
      `Updated ${exposeResult.modifiedCount} expose documents with new metric fields`
    );

    // Create indexes for new collections if they don't exist
    const db = mongoose.connection.db;

    // Comments collection indexes
    try {
      await db
        .collection("comments")
        .createIndex({ exposeId: 1, createdAt: -1 });
      await db.collection("comments").createIndex({ anonymousId: 1 });
      await db.collection("comments").createIndex({ ipHash: 1, createdAt: -1 });
      await db
        .collection("comments")
        .createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
      console.log("Created indexes for comments collection");
    } catch (error) {
      console.log("Comments indexes may already exist:", error.message);
    }

    // View tracking collection indexes
    try {
      await db.collection("viewTracking").createIndex({ exposeId: 1 });
      await db
        .collection("viewTracking")
        .createIndex({ sessionId: 1, exposeId: 1 }, { unique: true });
      await db
        .collection("viewTracking")
        .createIndex({ ipHash: 1, exposeId: 1 });
      await db
        .collection("viewTracking")
        .createIndex({ viewedAt: 1 }, { expireAfterSeconds: 2592000 });
      console.log("Created indexes for viewTracking collection");
    } catch (error) {
      console.log("ViewTracking indexes may already exist:", error.message);
    }

    // Enhanced expose collection indexes
    try {
      await db.collection("exposes").createIndex({ views: -1 });
      await db.collection("exposes").createIndex({ commentCount: -1 });
      await db
        .collection("exposes")
        .createIndex({ views: -1, commentCount: -1, upvotes: -1 });
      console.log("Created enhanced indexes for exposes collection");
    } catch (error) {
      console.log("Enhanced expose indexes may already exist:", error.message);
    }

    console.log("Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateDatabase();
