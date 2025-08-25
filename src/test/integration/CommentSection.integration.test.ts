import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Integration test for CommentSection component with real API
describe("CommentSection Integration", () => {
  const testExposeId = "expose_test_integration";

  beforeAll(async () => {
    // Setup: Create a test expose if needed
    // This would typically be done in a test database
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    // This would typically clean up the test database
  });

  it("should fetch comments from API endpoint", async () => {
    const response = await fetch(
      `/api/expose/comments?exposeId=${testExposeId}&limit=10&offset=0&sort=newest`
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("data");

    if (data.success) {
      expect(data.data).toHaveProperty("comments");
      expect(data.data).toHaveProperty("pagination");
      expect(data.data).toHaveProperty("exposeId");
      expect(Array.isArray(data.data.comments)).toBe(true);
    }
  });

  it("should handle invalid exposeId gracefully", async () => {
    const response = await fetch(
      `/api/expose/comments?exposeId=invalid_id&limit=10&offset=0&sort=newest`
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Invalid expose ID format");
  });

  it("should handle missing exposeId parameter", async () => {
    const response = await fetch(
      `/api/expose/comments?limit=10&offset=0&sort=newest`
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("exposeId parameter is required");
  });

  it("should validate pagination parameters", async () => {
    const response = await fetch(
      `/api/expose/comments?exposeId=${testExposeId}&limit=100&offset=-1&sort=newest`
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Limit must be|Offset must be/);
  });

  it("should validate sort parameter", async () => {
    const response = await fetch(
      `/api/expose/comments?exposeId=${testExposeId}&limit=10&offset=0&sort=invalid`
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Sort must be one of");
  });
});
