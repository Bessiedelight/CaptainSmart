/**
 * Complete test for views API endpoint
 * This test creates a test expose and then tests the view tracking functionality
 */

const BASE_URL = "http://localhost:3000";

async function createTestExpose() {
  console.log("📝 Creating test expose...");

  const testExpose = {
    title: "Test Expose for Views API",
    description:
      "This is a test expose created for testing the views API endpoint",
    hashtag: "#test",
    imageUrls: [],
  };

  try {
    const response = await fetch(`${BASE_URL}/api/expose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testExpose),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Test expose created successfully");
      console.log("Expose ID:", result.data.exposeId);
      return result.data.exposeId;
    } else {
      console.log("❌ Failed to create test expose");
      console.log("Response:", result);
      return null;
    }
  } catch (error) {
    console.error("Error creating test expose:", error);
    return null;
  }
}

async function generateSessionId() {
  // Generate a session ID in the expected format
  const randomBytes = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("");
  return `session_${randomBytes}`;
}

async function testViewsAPI() {
  console.log("🧪 Testing Views API Endpoint...\n");

  // First create a test expose
  const testExposeId = await createTestExpose();
  if (!testExposeId) {
    console.log("❌ Cannot proceed without a test expose");
    return;
  }

  try {
    // Generate test session IDs
    const sessionId1 = await generateSessionId();
    const sessionId2 = await generateSessionId();

    console.log("Generated session IDs:", { sessionId1, sessionId2 });

    // Test 1: Record a new view
    console.log("\n=== Test 1: Recording a new view ===");
    const response1 = await fetch(`${BASE_URL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        sessionId: sessionId1,
      }),
    });

    const result1 = await response1.json();
    console.log("Response status:", response1.status);
    console.log("Response body:", JSON.stringify(result1, null, 2));

    if (response1.ok && result1.success && result1.newView === true) {
      console.log("✅ Successfully recorded new view");
    } else {
      console.log("❌ Failed to record new view");
    }

    // Test 2: Try to record the same view again (should not increment)
    console.log("\n=== Test 2: Recording duplicate view (same session) ===");
    const response2 = await fetch(`${BASE_URL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        sessionId: sessionId1, // Same session ID
      }),
    });

    const result2 = await response2.json();
    console.log("Response status:", response2.status);
    console.log("Response body:", JSON.stringify(result2, null, 2));

    if (response2.ok && result2.success && result2.newView === false) {
      console.log("✅ Correctly prevented duplicate view from same session");
    } else {
      console.log("❌ Should have prevented duplicate view");
    }

    // Test 3: Record view from different session (should increment)
    console.log("\n=== Test 3: Recording view from different session ===");
    const response3 = await fetch(`${BASE_URL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        sessionId: sessionId2, // Different session ID
      }),
    });

    const result3 = await response3.json();
    console.log("Response status:", response3.status);
    console.log("Response body:", JSON.stringify(result3, null, 2));

    if (response3.ok && result3.success && result3.newView === true) {
      console.log("✅ Successfully recorded view from different session");
    } else {
      console.log("❌ Failed to record view from different session");
    }

    // Test 4: Test with invalid exposeId
    console.log("\n=== Test 4: Invalid expose ID ===");
    const response4 = await fetch(`${BASE_URL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: "invalid_id",
        sessionId: sessionId1,
      }),
    });

    const result4 = await response4.json();
    console.log("Response status:", response4.status);
    console.log("Response body:", JSON.stringify(result4, null, 2));

    if (response4.status === 400 && result4.code === "INVALID_EXPOSE_ID") {
      console.log("✅ Correctly rejected invalid expose ID format");
    } else {
      console.log("❌ Should have rejected invalid expose ID format");
    }

    // Test 5: Test with missing fields
    console.log("\n=== Test 5: Missing required fields ===");
    const response5 = await fetch(`${BASE_URL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        // Missing sessionId
      }),
    });

    const result5 = await response5.json();
    console.log("Response status:", response5.status);
    console.log("Response body:", JSON.stringify(result5, null, 2));

    if (response5.status === 400 && result5.code === "MISSING_FIELDS") {
      console.log("✅ Correctly rejected request with missing fields");
    } else {
      console.log("❌ Should have rejected request with missing fields");
    }

    // Test 6: Test with invalid session ID format
    console.log("\n=== Test 6: Invalid session ID format ===");
    const response6 = await fetch(`${BASE_URL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        sessionId: "invalid_session_id",
      }),
    });

    const result6 = await response6.json();
    console.log("Response status:", response6.status);
    console.log("Response body:", JSON.stringify(result6, null, 2));

    if (response6.status === 400 && result6.code === "INVALID_SESSION_ID") {
      console.log("✅ Correctly rejected invalid session ID format");
    } else {
      console.log("❌ Should have rejected invalid session ID format");
    }

    // Test 7: Test with non-existent expose
    console.log("\n=== Test 7: Non-existent expose ===");
    const response7 = await fetch(`${BASE_URL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: "expose_nonexistent_12345",
        sessionId: sessionId1,
      }),
    });

    const result7 = await response7.json();
    console.log("Response status:", response7.status);
    console.log("Response body:", JSON.stringify(result7, null, 2));

    if (response7.status === 404 && result7.code === "EXPOSE_NOT_FOUND") {
      console.log("✅ Correctly returned 404 for non-existent expose");
    } else {
      console.log("❌ Should have returned 404 for non-existent expose");
    }

    // Test 8: Verify view count in expose document
    console.log("\n=== Test 8: Verifying view count in expose document ===");
    const exposeResponse = await fetch(`${BASE_URL}/api/expose?hashtag=test`);
    const exposeResult = await exposeResponse.json();

    if (exposeResponse.ok && exposeResult.success) {
      const testExpose = exposeResult.data.exposes.find(
        (e) => e.exposeId === testExposeId
      );
      if (testExpose) {
        console.log("Expose view count:", testExpose.views);
        if (testExpose.views >= 2) {
          // Should have at least 2 views from our tests
          console.log("✅ View count correctly updated in expose document");
        } else {
          console.log("❌ View count not properly updated");
        }
      } else {
        console.log("❌ Could not find test expose in results");
      }
    } else {
      console.log("❌ Failed to fetch expose data for verification");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
console.log("Starting Views API tests...");
console.log("Make sure your Next.js server is running on localhost:3000");
console.log("This test will create a temporary expose for testing\n");

testViewsAPI()
  .then(() => {
    console.log("\n🎉 Tests completed!");
  })
  .catch(console.error);
