import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/expose/route";
import { Expose } from "@/databaseModels/exposeModel";

// Mock dependencies
vi.mock("@/utils/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/databaseModels/exposeModel", () => ({
  Expose: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock("@/lib/startup", () => ({}));

describe("/api/expose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/expose", () => {
    const mockExposes = [
      {
        _id: "507f1f77bcf86cd799439011",
        exposeId: "expose_123_abc",
        title: "Test Expose 1",
        description: "Test description 1",
        hashtag: "#corruption",
        imageUrls: ["https://example.com/image1.jpg"],
        audioUrl: "https://example.com/audio1.mp3",
        upvotes: 5,
        downvotes: 2,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "507f1f77bcf86cd799439012",
        exposeId: "expose_456_def",
        title: "Test Expose 2",
        description: "Test description 2",
        hashtag: "#fraud",
        imageUrls: [],
        upvotes: 10,
        downvotes: 1,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockExposes),
      };
      vi.mocked(Expose.find).mockReturnValue(mockQuery as any);
      vi.mocked(Expose.countDocuments).mockResolvedValue(2);
    });

    it("should return exposes with default parameters", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.exposes).toHaveLength(2);
      expect(data.data.pagination.total).toBe(2);
      expect(data.data.pagination.limit).toBe(20);
      expect(data.data.pagination.offset).toBe(0);
    });

    it("should filter by hashtag", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?hashtag=%23corruption"
      );
      await GET(request);

      expect(Expose.find).toHaveBeenCalledWith({
        expiresAt: { $gt: expect.any(Date) },
        hashtag: "#corruption",
      });
    });

    it("should sort by newest (default)", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?sort=newest"
      );
      await GET(request);

      const mockQuery = vi.mocked(Expose.find).mock.results[0].value;
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it("should sort by trending", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?sort=trending"
      );
      await GET(request);

      const mockQuery = vi.mocked(Expose.find).mock.results[0].value;
      expect(mockQuery.sort).toHaveBeenCalledWith({
        upvotes: -1,
        downvotes: 1,
        createdAt: -1,
      });
    });

    it("should sort by expiring", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?sort=expiring"
      );
      await GET(request);

      const mockQuery = vi.mocked(Expose.find).mock.results[0].value;
      expect(mockQuery.sort).toHaveBeenCalledWith({ expiresAt: 1 });
    });

    it("should handle pagination parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?limit=10&offset=5"
      );
      await GET(request);

      const mockQuery = vi.mocked(Expose.find).mock.results[0].value;
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.skip).toHaveBeenCalledWith(5);
    });

    it("should return error for invalid limit", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?limit=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_LIMIT");
    });

    it("should return error for limit exceeding maximum", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?limit=101"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_LIMIT");
    });

    it("should return error for negative offset", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?offset=-1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_OFFSET");
    });

    it("should return error for invalid sort parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?sort=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_SORT");
    });

    it("should return error for invalid hashtag format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/expose?hashtag=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_HASHTAG");
    });

    it("should calculate metadata for each expose", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose");
      const response = await GET(request);
      const data = await response.json();

      const expose = data.data.exposes[0];
      expect(expose.timeRemaining).toBeDefined();
      expect(expose.netVotes).toBe(3); // 5 upvotes - 2 downvotes
      expect(expose._id).toBe("507f1f77bcf86cd799439011");
    });

    it("should handle database errors", async () => {
      vi.mocked(Expose.find).mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const request = new NextRequest("http://localhost:3000/api/expose");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe("DATABASE_ERROR");
    });
  });

  describe("POST /api/expose", () => {
    const validExposeData = {
      title: "Test Expose",
      description: "This is a test expose description",
      hashtag: "#corruption",
      imageUrls: ["https://example.com/image1.jpg"],
      audioUrl: "https://example.com/audio.mp3",
    };

    const mockSavedExpose = {
      _id: "507f1f77bcf86cd799439011",
      exposeId: "expose_123_abc",
      ...validExposeData,
      upvotes: 0,
      downvotes: 0,
      expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => ({ ...mockSavedExpose }),
    };

    beforeEach(() => {
      // Mock the Expose constructor and save method
      const mockExpose = {
        ...mockSavedExpose,
        save: vi.fn().mockResolvedValue(mockSavedExpose),
      };

      // Mock the Expose constructor
      vi.mocked(Expose).mockImplementation(() => mockExpose as any);
    });

    it("should create a new expose with valid data", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(validExposeData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(validExposeData.title);
      expect(data.data.description).toBe(validExposeData.description);
      expect(data.data.hashtag).toBe(validExposeData.hashtag);
      expect(data.data.upvotes).toBe(0);
      expect(data.data.downvotes).toBe(0);
      expect(data.data.netVotes).toBe(0);
      expect(data.data.timeRemaining).toBeDefined();
    });

    it("should return error for invalid JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_JSON");
    });

    it("should return error for missing required fields", async () => {
      const incompleteData = { title: "Test" };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(incompleteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("MISSING_REQUIRED_FIELDS");
      expect(data.details.missing).toContain("description");
      expect(data.details.missing).toContain("hashtag");
    });

    it("should return error for invalid field types", async () => {
      const invalidData = {
        title: 123,
        description: "valid",
        hashtag: "#test",
      };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_FIELD_TYPES");
    });

    it("should return error for empty title", async () => {
      const invalidData = { ...validExposeData, title: "   " };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EMPTY_TITLE");
    });

    it("should return error for title too long", async () => {
      const invalidData = { ...validExposeData, title: "a".repeat(201) };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("TITLE_TOO_LONG");
      expect(data.details.maxLength).toBe(200);
      expect(data.details.currentLength).toBe(201);
    });

    it("should return error for empty description", async () => {
      const invalidData = { ...validExposeData, description: "   " };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EMPTY_DESCRIPTION");
    });

    it("should return error for description too long", async () => {
      const invalidData = { ...validExposeData, description: "a".repeat(2001) };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("DESCRIPTION_TOO_LONG");
    });

    it("should return error for invalid hashtag format", async () => {
      const invalidData = { ...validExposeData, hashtag: "invalid" };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_HASHTAG_FORMAT");
    });

    it("should return error for hashtag too short", async () => {
      const invalidData = { ...validExposeData, hashtag: "#" };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_HASHTAG_LENGTH");
    });

    it("should return error for hashtag with invalid characters", async () => {
      const invalidData = { ...validExposeData, hashtag: "#test@hashtag" };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_HASHTAG_CHARACTERS");
    });

    it("should return error for invalid image URLs array type", async () => {
      const invalidData = { ...validExposeData, imageUrls: "not an array" };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_IMAGE_URLS_TYPE");
    });

    it("should return error for too many images", async () => {
      const invalidData = {
        ...validExposeData,
        imageUrls: Array(6).fill("https://example.com/image.jpg"),
      };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("TOO_MANY_IMAGES");
    });

    it("should return error for invalid image URL format", async () => {
      const invalidData = { ...validExposeData, imageUrls: ["invalid-url"] };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_IMAGE_URL");
    });

    it("should return error for invalid audio URL format", async () => {
      const invalidData = { ...validExposeData, audioUrl: "invalid-url" };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_AUDIO_URL");
    });

    it("should trim whitespace from title, description, and hashtag", async () => {
      const dataWithWhitespace = {
        title: "  Test Title  ",
        description: "  Test Description  ",
        hashtag: "  #test  ",
        imageUrls: [],
      };
      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(dataWithWhitespace),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.title).toBe("Test Title");
      expect(data.data.description).toBe("Test Description");
      expect(data.data.hashtag).toBe("#test");
    });

    it("should handle database errors", async () => {
      const mockExpose = {
        save: vi.fn().mockRejectedValue(new Error("Database error")),
      };
      vi.mocked(Expose).mockImplementation(() => mockExpose as any);

      const request = new NextRequest("http://localhost:3000/api/expose", {
        method: "POST",
        body: JSON.stringify(validExposeData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe("DATABASE_ERROR");
    });
  });
});
