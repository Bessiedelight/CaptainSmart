/**
 * Test script to verify comprehensive error handling implementation
 * Run this with: node test-error-handling.js
 */

const BASE_URL = "http://localhost:3000";

// Test scenarios for different error conditions
const testScenarios = [
  {
    name: "Invalid JSON in POST request",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "INVALID_JSON",
        actualCode: data.code,
        success: response.status === 400 && data.code === "INVALID_JSON",
      };
    },
  },
  {
    name: "Missing required fields",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test" }), // Missing description and hashtag
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "MISSING_REQUIRED_FIELDS",
        actualCode: data.code,
        success:
          response.status === 400 && data.code === "MISSING_REQUIRED_FIELDS",
      };
    },
  },
  {
    name: "Invalid hashtag format",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test",
          description: "Test description",
          hashtag: "invalid-hashtag", // Should start with #
        }),
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "INVALID_HASHTAG_FORMAT",
        actualCode: data.code,
        success:
          response.status === 400 && data.code === "INVALID_HASHTAG_FORMAT",
      };
    },
  },
  {
    name: "Title too long",
    test: async () => {
      const longTitle = "a".repeat(201); // Exceeds 200 character limit
      const response = await fetch(`${BASE_URL}/api/expose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: longTitle,
          description: "Test description",
          hashtag: "#test",
        }),
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "TITLE_TOO_LONG",
        actualCode: data.code,
        success: response.status === 400 && data.code === "TITLE_TOO_LONG",
      };
    },
  },
  {
    name: "Invalid vote type",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exposeId: "test-id",
          voteType: "invalid", // Should be 'upvote' or 'downvote'
        }),
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "INVALID_VOTE_TYPE",
        actualCode: data.code,
        success: response.status === 400 && data.code === "INVALID_VOTE_TYPE",
      };
    },
  },
  {
    name: "Method not allowed on vote endpoint",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose/vote`, {
        method: "GET",
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 405,
        expectedCode: "METHOD_NOT_ALLOWED",
        actualCode: data.code,
        success: response.status === 405 && data.code === "METHOD_NOT_ALLOWED",
      };
    },
  },
  {
    name: "Invalid pagination parameters",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose?limit=invalid`);
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "INVALID_LIMIT",
        actualCode: data.code,
        success: response.status === 400 && data.code === "INVALID_LIMIT",
      };
    },
  },
  {
    name: "Invalid sort parameter",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose?sort=invalid`);
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "INVALID_SORT",
        actualCode: data.code,
        success: response.status === 400 && data.code === "INVALID_SORT",
      };
    },
  },
  {
    name: "Empty form data on upload endpoint",
    test: async () => {
      const formData = new FormData();
      const response = await fetch(`${BASE_URL}/api/expose/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 400,
        expectedCode: "NO_FILES_PROVIDED",
        actualCode: data.code,
        success: response.status === 400 && data.code === "NO_FILES_PROVIDED",
      };
    },
  },
  {
    name: "Method not allowed on upload endpoint",
    test: async () => {
      const response = await fetch(`${BASE_URL}/api/expose/upload`, {
        method: "GET",
      });
      const data = await response.json();
      return {
        status: response.status,
        expectedStatus: 405,
        expectedCode: "METHOD_NOT_ALLOWED",
        actualCode: data.code,
        success: response.status === 405 && data.code === "METHOD_NOT_ALLOWED",
      };
    },
  },
];

// Run all tests
async function runTests() {
  console.log("🧪 Running Error Handling Tests...\n");

  let passed = 0;
  let failed = 0;

  for (const scenario of testScenarios) {
    try {
      console.log(`Testing: ${scenario.name}`);
      const result = await scenario.test();

      if (result.success) {
        console.log(
          `✅ PASS - Status: ${result.status}, Code: ${result.actualCode}`
        );
        passed++;
      } else {
        console.log(
          `❌ FAIL - Expected: ${result.expectedStatus}/${result.expectedCode}, Got: ${result.status}/${result.actualCode}`
        );
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      failed++;
    }
    console.log("");
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 All error handling tests passed!");
  } else {
    console.log(
      "\n⚠️  Some tests failed. Please check the error handling implementation."
    );
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/expose?limit=1`);
    return response.status !== undefined;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log("🔍 Checking if server is running...");

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log(
      "❌ Server is not running. Please start the Next.js development server first:"
    );
    console.log("   npm run dev");
    console.log("   or");
    console.log("   yarn dev");
    process.exit(1);
  }

  console.log("✅ Server is running. Starting tests...\n");
  await runTests();
}

main().catch(console.error);
