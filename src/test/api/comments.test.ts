import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the database connection
vi.mock("@/utils/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

// Create mock functions for the models
const mockCommentFind = vi.fn();
const mockCommentCountDocuments = vi.fn();
const mockCommentSave = vi.fn();
const mockExposeFind = vi.fn();
const mockExposeUpdateOne = vi.fn();

// Mock the Comment model
vi.mock("@/databaseModels/commentModel", () => ({
  Comment: vi.fn().mockImplementation(() => ({
    save: mockCommentSave,
    toObject: () => ({
      _id: "507f1f77bcf86cd799439011",
      commentId: "comment_123_abc",
      exposeId: "expose_123_abc",
      content: "This is a test comment",
      anonymousId: "anon_1234567890abcdef",
      ipHash: "a".repeat(64),
      userAgent: "Test User Agent",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  })),
  CommentUtils: {
    generateConsistentAnonymousId: vi
      .fn()
      .mockReturnValue("anon_1234567890abcdef"),
    hashIP: vi.fn().mockReturnValue("a".repeat(64)),
  },
}));

// Mock the Expose model
vi.mock("@/databaseModels/exposeModel", () => ({
  Expose: {
    findOne: mockExposeFind,
    updateOne: mockExposeUpdateOne,
  },
}));

// Add static methods to Comment mock
Object.assign(
  vi.mocked(await import("@/databaseModels/commentModel")).Comment,
  {
    find: mockCommentFind,
    countDocuments: mockCommentCountDocuments,
  }
);

describe("/api/expose/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockCommentSave.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      commentId: "comment_123_abc",
      exposeId: "expose_123_abc",
      content: "This is a test comment",
      anonymousId: "anon_1234567890abcdef",
      ipHash: "a".repeat(64),
      userAgent: "Test User Agent",
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => ({
        _id: "507f1f77bcf86cd799439011",
        commentId: "comment_123_abc",
        exposeId: "expose_123_abc",
        content: "This is a test comment",
        anonymousId: "anon_1234567890abcdef",
        ipHash: "a".repeat(64),
        userAgent: "Test User Agent",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    mockExposeFind.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439013",
        exposeId: "expose_123_abc",
        title: "Test Expose",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    });

    mockExposeUpdateOne.mockResolvedValue({ acknowledged: true });
    mockCommentCountDocuments.mockResolvedValue(0);
  });

  describe("GET /api/expose/comments", () => {
    beforeEach(() => {
      const mockComments = [
        {
          _id: "507f1f77bcf86cd799439011",
          commentId: "comment_123_abc",
          exposeId: "expose_123_abc",
          content: "This is a great post!",
          anonymousId: "anon_1234567890abcdef",
          ipHash: "a".repeat(64),
          userAgent: "Test User Agent",
          createdAt: new Date("2024-01-01T10:00:00Z"),
          updatedAt: new Date("2024-01-01T10:00:00Z"),
        },
        {
          _id: "507f1f77bcf86cd799439012",
          commentId: "comment_456_def",
          exposeId: "expose_123_abc",
          content: "I totally agree!",
          anonymousId: "anon_fedcba0987654321",
          ipHash: "b".repeat(64),
          userAgent: "Another User Agent",
          createdAt: new Date("2024-01-01T11:00:00Z"),
          updatedAt: new Date("2024-01-01T11:00:00Z"),
        },
      ];

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockComments),
      };

      mockCommentFind.mockReturnValue(mockQuery);
      mockCommentCountDocuments.mockResolvedValue(2);
    });

    it("should return error for missing exposeId", async () => {
      const { GET } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("MISSING_EXPOSE_ID");
    });

    it("should return error for invalid exposeId format", async () => {
      const { GET } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments?exposeId=invalid_id"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_EXPOSE_ID");
    });

    it("should return error for non-existent expose", async () => {
      mockExposeFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const { GET } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments?exposeId=expose_nonexistent"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EXPOSE_NOT_FOUND");
    });

    it("should return error for invalid limit", async () => {
      const { GET } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments?exposeId=expose_123_abc&limit=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_LIMIT");
    });

    it("should return error for limit exceeding maximum", async () => {
      const { GET } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments?exposeId=expose_123_abc&limit=51"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_LIMIT");
    });

    it("should return error for negative offset", async () => {
      const { GET } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments?exposeId=expose_123_abc&offset=-1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_OFFSET");
    });

    it("should return error for invalid sort parameter", async () => {
      const { GET } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments?exposeId=expose_123_abc&sort=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_SORT");
    });
  });

  describe("POST /api/expose/comments", () => {
    const validCommentData = {
      exposeId: "expose_123_abc",
      content: "This is a test comment",
    };

    it("should return error for invalid JSON", async () => {
      const { POST } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: "invalid json",
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_JSON");
    });

    it("should return error for missing required fields", async () => {
      const { POST } = await import("@/app/api/expose/comments/route");
      const incompleteData = { exposeId: "expose_123_abc" };
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: JSON.stringify(incompleteData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("MISSING_REQUIRED_FIELDS");
      expect(data.details.missing).toContain("content");
    });

    it("should return error for invalid field types", async () => {
      const { POST } = await import("@/app/api/expose/comments/route");
      const invalidData = {
        exposeId: 123,
        content: "valid content",
      };
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_FIELD_TYPES");
    });

    it("should return error for invalid exposeId format", async () => {
      const { POST } = await import("@/app/api/expose/comments/route");
      const invalidData = { ...validCommentData, exposeId: "invalid_id" };
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_EXPOSE_ID");
    });

    it("should return error for empty content", async () => {
      const { POST } = await import("@/app/api/expose/comments/route");
      const invalidData = { ...validCommentData, content: "   " };
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EMPTY_CONTENT");
    });

    it("should return error for content too long", async () => {
      const { POST } = await import("@/app/api/expose/comments/route");
      const invalidData = { ...validCommentData, content: "a".repeat(501) };
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("CONTENT_TOO_LONG");
      expect(data.details.maxLength).toBe(500);
      expect(data.details.currentLength).toBe(501);
    });

    it("should return error for non-existent or expired expose", async () => {
      mockExposeFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const { POST } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: JSON.stringify(validCommentData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EXPOSE_NOT_FOUND_OR_EXPIRED");
    });

    it("should enforce rate limiting", async () => {
      mockCommentCountDocuments.mockResolvedValue(5);

      const { POST } = await import("@/app/api/expose/comments/route");
      const request = new NextRequest(
        "http://localhost:3000/api/expose/comments",
        {
          method: "POST",
          body: JSON.stringify(validCommentData),
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "192.168.1.1",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(data.details.retryAfter).toBe(300);
    });
  });
});
