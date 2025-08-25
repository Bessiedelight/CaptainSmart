/**
 * Simple test for comments API endpoints
 * This test verifies the API endpoints are properly implemented
 */

const BASE_URL = "http://localhost:3000";

async function testCommentsAPI() {
  console.log("🧪 Testing Comments API Endpoints...\n");

  try {
    // Test 1: Test GET endpoint with missing exposeId
    console.log("1. Testing GET /api/expose/comments without exposeId...");
    const response1 = await fetch(`${BASE_URL}/api/expose/comments`);
    const result1 = await response1.json();

    if (response1.status === 400 && result1.code === "MISSING_EXPOSE_ID") {
      console.log("✅ Correctly rejected request without exposeId");
    } else {
      console.log("❌ Should have rejected request without exposeId");
      console.log("Response:", result1);
    }

    // Test 2: Test GET endpoint with invalid exposeId format
    console.log(
      "\n2. Testing GET /api/expose/comments with invalid exposeId..."
    );
    const response2 = await fetch(
      `${BASE_URL}/api/expose/comments?exposeId=invalid_id`
    );
    const result2 = await response2.json();

    if (response2.status === 400 && result2.code === "INVALID_EXPOSE_ID") {
      console.log("✅ Correctly rejected invalid exposeId format");
    } else {
      console.log("❌ Should have rejected invalid exposeId format");
      console.log("Response:", result2);
    }

    // Test 3: Test GET endpoint with non-existent exposeId
    console.log(
      "\n3. Testing GET /api/expose/comments with non-existent exposeId..."
    );
    const response3 = await fetch(
      `${BASE_URL}/api/expose/comments?exposeId=expose_nonexistent`
    );
    const result3 = await response3.json();

    if (response3.status === 404 && result3.code === "EXPOSE_NOT_FOUND") {
      console.log("✅ Correctly returned 404 for non-existent expose");
    } else {
      console.log("❌ Should have returned 404 for non-existent expose");
      console.log("Response:", result3);
    }

    // Test 4: Test POST endpoint with missing fields
    console.log(
      "\n4. Testing POST /api/expose/comments with missing fields..."
    );
    const response4 = await fetch(`${BASE_URL}/api/expose/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const result4 = await response4.json();

    if (
      response4.status === 400 &&
      result4.code === "MISSING_REQUIRED_FIELDS"
    ) {
      console.log("✅ Correctly rejected request with missing fields");
    } else {
      console.log("❌ Should have rejected request with missing fields");
      console.log("Response:", result4);
    }

    // Test 5: Test POST endpoint with empty content
    console.log("\n5. Testing POST /api/expose/comments with empty content...");
    const response5 = await fetch(`${BASE_URL}/api/expose/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: "expose_test",
        content: "   ",
      }),
    });
    const result5 = await response5.json();

    if (response5.status === 400 && result5.code === "EMPTY_CONTENT") {
      console.log("✅ Correctly rejected empty content");
    } else {
      console.log("❌ Should have rejected empty content");
      console.log("Response:", result5);
    }

    // Test 6: Test POST endpoint with content too long
    console.log(
      "\n6. Testing POST /api/expose/comments with content too long..."
    );
    const longContent = "a".repeat(501);
    const response6 = await fetch(`${BASE_URL}/api/expose/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: "expose_test",
        content: longContent,
      }),
    });
    const result6 = await response6.json();

    if (response6.status === 400 && result6.code === "CONTENT_TOO_LONG") {
      console.log("✅ Correctly rejected content that is too long");
    } else {
      console.log("❌ Should have rejected content that is too long");
      console.log("Response:", result6);
    }

    console.log("\n🎉 API endpoint validation tests completed!");
    console.log("\n📝 Note: To test successful operations, you need:");
    console.log("   - A running Next.js server (npm run dev)");
    console.log("   - A valid expose in the database");
    console.log("   - Proper MongoDB connection");
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log(
        "❌ Cannot connect to server. Make sure Next.js is running on port 3000"
      );
      console.log("   Run: npm run dev");
    } else {
      console.log("❌ Test failed with error:", error.message);
    }
  }
}

// Run the test
testCommentsAPI();
