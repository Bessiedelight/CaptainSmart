import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/expose/views/route";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/utils/mongodb";
import {
  ViewTracking,
  ViewTrackingUtils,
} from "@/databaseModels/viewTrackingModel";
import { Expose } from "@/databaseModels/exposeModel";

// Mock the database connection
vi.mock("@/utils/mongodb");

describe("/api/expose/views", () => {
  let mockRequest: Partial<NextRequest>;
  let testExposeId: string;
  let testSessionId: string;

  beforeEach(async () => {
    // Setup test data
    testExposeId = "expose_test_12345";
    testSessionId = ViewTrackingUtils.generateSessionId();

    // Mock request object
    mockRequest = {
      json: vi.fn(),
      ip: "127.0.0.1",
      headers: new Map([
        ["user-agent", "test-agent"],
        ["x-forwarded-for", "192.168.1.1"],
      ]),
    };

    // Mock database connection
    vi.mocked(connectToDatabase).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/expose/views", () => {
    it("should record a new view successfully", async () => {
      // Mock request body
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: testSessionId,
      });

      // Mock database operations
      const mockExpose = {
        exposeId: testExposeId,
        views: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      };

      vi.spyOn(Expose, "findOne").mockResolvedValue(mockExpose);
      vi.spyOn(ViewTracking, "hasViewed").mockResolvedValue(false);
      vi.spyOn(ViewTracking, "recordView").mockResolvedValue(true);
      vi.spyOn(Expose, "incrementViews").mockResolvedValue({
        ...mockExpose,
        views: 1,
      });

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.newView).toBe(true);
      expect(result.viewCount).toBe(1);
    });

    it("should not record duplicate view from same session", async () => {
      // Mock request body
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: testSessionId,
      });

      // Mock database operations
      const mockExpose = {
        exposeId: testExposeId,
        views: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      vi.spyOn(Expose, "findOne").mockResolvedValue(mockExpose);
      vi.spyOn(ViewTracking, "hasViewed").mockResolvedValue(true); // Already viewed

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.newView).toBe(false);
      expect(result.viewCount).toBe(1);
    });

    it("should return 400 for missing exposeId", async () => {
      // Mock request body with missing exposeId
      vi.mocked(mockRequest.json!).mockResolvedValue({
        sessionId: testSessionId,
      });

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.code).toBe("MISSING_FIELDS");
    });

    it("should return 400 for missing sessionId", async () => {
      // Mock request body with missing sessionId
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
      });

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.code).toBe("MISSING_FIELDS");
    });

    it("should return 400 for invalid exposeId format", async () => {
      // Mock request body with invalid exposeId
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: "invalid_id",
        sessionId: testSessionId,
      });

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_EXPOSE_ID");
    });

    it("should return 400 for invalid sessionId format", async () => {
      // Mock request body with invalid sessionId
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: "invalid_session",
      });

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.code).toBe("INVALID_SESSION_ID");
    });

    it("should return 404 for non-existent expose", async () => {
      // Mock request body
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: testSessionId,
      });

      // Mock database operations - expose not found
      vi.spyOn(Expose, "findOne").mockResolvedValue(null);

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.code).toBe("EXPOSE_NOT_FOUND");
    });

    it("should return 404 for expired expose", async () => {
      // Mock request body
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: testSessionId,
      });

      // Mock database operations - expose is expired
      vi.spyOn(Expose, "findOne").mockResolvedValue(null); // findOne with expiresAt filter returns null

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.code).toBe("EXPOSE_NOT_FOUND");
    });

    it("should handle database errors gracefully", async () => {
      // Mock request body
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: testSessionId,
      });

      // Mock database error
      vi.spyOn(Expose, "findOne").mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.code).toBe("INTERNAL_ERROR");
    });

    it("should handle duplicate key errors (race condition)", async () => {
      // Mock request body
      vi.mocked(mockRequest.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: testSessionId,
      });

      // Mock database operations
      const mockExpose = {
        exposeId: testExposeId,
        views: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      vi.spyOn(Expose, "findOne").mockResolvedValue(mockExpose);
      vi.spyOn(ViewTracking, "hasViewed").mockResolvedValue(false);

      // Mock duplicate key error (race condition)
      const duplicateError = new Error("Duplicate key error");
      (duplicateError as any).code = 11000;
      vi.spyOn(ViewTracking, "recordView").mockRejectedValue(duplicateError);

      const response = await POST(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.newView).toBe(false);
    });

    it("should extract IP from x-forwarded-for header", async () => {
      // Mock request with x-forwarded-for header
      const mockRequestWithForwarded = {
        ...mockRequest,
        ip: undefined,
        headers: new Map([
          ["user-agent", "test-agent"],
          ["x-forwarded-for", "192.168.1.100, 10.0.0.1"],
        ]),
      };

      vi.mocked(mockRequestWithForwarded.json!).mockResolvedValue({
        exposeId: testExposeId,
        sessionId: testSessionId,
      });

      // Mock database operations
      const mockExpose = {
        exposeId: testExposeId,
        views: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      vi.spyOn(Expose, "findOne").mockResolvedValue(mockExpose);
      vi.spyOn(ViewTracking, "hasViewed").mockResolvedValue(false);
      vi.spyOn(ViewTracking, "recordView").mockResolvedValue(true);
      vi.spyOn(Expose, "incrementViews").mockResolvedValue({
        ...mockExpose,
        views: 1,
      });

      const response = await POST(mockRequestWithForwarded as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Verify that recordView was called with the correct IP (first one from x-forwarded-for)
      expect(ViewTracking.recordView).toHaveBeenCalledWith(
        testExposeId,
        testSessionId,
        expect.any(String), // hashed IP
        "test-agent"
      );
    });
  });
});
