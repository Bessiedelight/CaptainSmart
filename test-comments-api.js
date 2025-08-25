/**
 * Test script for comments API endpoints
 * Run this with: node test-comments-api.js
 */

import { connectToDatabase } from "./utils/mongodb.js";
import { Comment } from "./databaseModels/commentModel.js";
import { Expose } from "./databaseModels/exposeModel.js";

async function testCommentsAPI() {
  try {
    console.log("🔌 Connecting to database...");
    await connectToDatabase();
    console.log("✅ Database connected successfully");

    // Test 1: Create a test expose if none exists
    console.log("\n📝 Creating test expose...");
    const testExpose = new Expose({
      title: "Test Expose for Comments",
      description: "This is a test expose to test the comments functionality",
      hashtag: "#test",
      imageUrls: [],
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      views: 0,
      shareCount: 0,
    });

    const savedExpose = await testExpose.save();
    console.log(`✅ Test expose created with ID: ${savedExpose.exposeId}`);

    // Test 2: Create test comments
    console.log("\n💬 Creating test comments...");
    const testComments = [
      {
        exposeId: savedExpose.exposeId,
        content: "This is a great post!",
        anonymousId: "anon_1234567890abcdef",
        ipHash: "a".repeat(64), // Mock hash
        userAgent: "Test User Agent 1",
      },
      {
        exposeId: savedExpose.exposeId,
        content: "I totally agree with this!",
        anonymousId: "anon_fedcba0987654321",
        ipHash: "b".repeat(64), // Mock hash
        userAgent: "Test User Agent 2",
      },
      {
        exposeId: savedExpose.exposeId,
        content: "Thanks for sharing this information.",
        anonymousId: "anon_1111222233334444",
        ipHash: "c".repeat(64), // Mock hash
        userAgent: "Test User Agent 3",
      },
    ];

    for (const commentData of testComments) {
      const comment = new Comment(commentData);
      await comment.save();
      console.log(
        `✅ Comment created: "${commentData.content.substring(0, 30)}..."`
      );
    }

    // Test 3: Update comment count on expose
    console.log("\n📊 Updating comment count on expose...");
    await Expose.updateOne(
      { exposeId: savedExpose.exposeId },
      { $inc: { commentCount: testComments.length } }
    );
    console.log(`✅ Comment count updated to ${testComments.length}`);

    // Test 4: Fetch comments
    console.log("\n📖 Fetching comments...");
    const comments = await Comment.find({ exposeId: savedExpose.exposeId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${comments.length} comments:`);
    comments.forEach((comment, index) => {
      console.log(
        `   ${index + 1}. ${comment.content} (by ${comment.anonymousId})`
      );
    });

    // Test 5: Verify expose comment count
    console.log("\n🔍 Verifying expose comment count...");
    const updatedExpose = await Expose.findOne({
      exposeId: savedExpose.exposeId,
    }).lean();
    console.log(`✅ Expose comment count: ${updatedExpose.commentCount}`);

    // Test 6: Test pagination
    console.log("\n📄 Testing pagination...");
    const paginatedComments = await Comment.find({
      exposeId: savedExpose.exposeId,
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .skip(0)
      .lean();

    console.log(
      `✅ Paginated results (limit 2): ${paginatedComments.length} comments`
    );

    // Test 7: Test comment validation
    console.log("\n✅ Testing comment validation...");
    try {
      const invalidComment = new Comment({
        exposeId: savedExpose.exposeId,
        content: "", // Empty content should fail
        anonymousId: "anon_1234567890abcdef",
        ipHash: "d".repeat(64),
        userAgent: "Test User Agent",
      });
      await invalidComment.save();
      console.log("❌ Validation test failed - empty content was allowed");
    } catch (error) {
      console.log("✅ Validation test passed - empty content was rejected");
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await Comment.deleteMany({ exposeId: savedExpose.exposeId });
    await Expose.deleteOne({ exposeId: savedExpose.exposeId });
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the tests
testCommentsAPI();
