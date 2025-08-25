const { ViewTrackingUtils } = require("./databaseModels/viewTrackingModel");

async function testViewsAPI() {
  const baseURL = "http://localhost:3000";

  // Generate a test session ID
  const sessionId = ViewTrackingUtils.generateSessionId();
  console.log("Generated session ID:", sessionId);

  // Test data
  const testExposeId = "expose_1734635400000_test123"; // You'll need to use a real expose ID

  try {
    // Test 1: Record a new view
    console.log("\n=== Test 1: Recording a new view ===");
    const response1 = await fetch(`${baseURL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        sessionId: sessionId,
      }),
    });

    const result1 = await response1.json();
    console.log("Response status:", response1.status);
    console.log("Response body:", JSON.stringify(result1, null, 2));

    // Test 2: Try to record the same view again (should not increment)
    console.log("\n=== Test 2: Recording duplicate view ===");
    const response2 = await fetch(`${baseURL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        sessionId: sessionId,
      }),
    });

    const result2 = await response2.json();
    console.log("Response status:", response2.status);
    console.log("Response body:", JSON.stringify(result2, null, 2));

    // Test 3: Test with invalid exposeId
    console.log("\n=== Test 3: Invalid expose ID ===");
    const response3 = await fetch(`${baseURL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: "invalid_id",
        sessionId: sessionId,
      }),
    });

    const result3 = await response3.json();
    console.log("Response status:", response3.status);
    console.log("Response body:", JSON.stringify(result3, null, 2));

    // Test 4: Test with missing fields
    console.log("\n=== Test 4: Missing fields ===");
    const response4 = await fetch(`${baseURL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        // Missing sessionId
      }),
    });

    const result4 = await response4.json();
    console.log("Response status:", response4.status);
    console.log("Response body:", JSON.stringify(result4, null, 2));

    // Test 5: Test with invalid session ID format
    console.log("\n=== Test 5: Invalid session ID format ===");
    const response5 = await fetch(`${baseURL}/api/expose/views`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exposeId: testExposeId,
        sessionId: "invalid_session_id",
      }),
    });

    const result5 = await response5.json();
    console.log("Response status:", response5.status);
    console.log("Response body:", JSON.stringify(result5, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
console.log("Starting Views API tests...");
console.log("Make sure your Next.js server is running on localhost:3000");
console.log(
  "You may need to update the testExposeId with a real expose ID from your database"
);

testViewsAPI()
  .then(() => {
    console.log("\nTests completed!");
  })
  .catch(console.error);
