import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET, PUT, DELETE } from "@/app/api/expose/vote/route";
import { Expose } from "@/databaseModels/exposeModel";

// Mock dependencies
vi.mock("@/utils/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/databaseModels/exposeModel", () => ({
  Expose: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

describe("/api/expose/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/expose/vote", () => {
    const validVoteData = {
      exposeId: "expose_123_abc",
      voteType: "upvote",
    };

    const mockExpose = {
      _id: "507f1f77bcf86cd799439011",
      exposeId: "expose_123_abc",
      title: "Test Expose",
      description: "Test description",
      hashtag: "#test",
      upvotes: 5,
      downvotes: 2,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUpdatedExpose = {
      ...mockExpose,
      upvotes: 6, // After upvote
    };

    beforeEach(() => {
      vi.mocked(Expose.findOne).mockResolvedValue(mockExpose);
      vi.mocked(Expose.findOneAndUpdate).mockResolvedValue(mockUpdatedExpose);
    });

    it("should successfully process an upvote", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.exposeId).toBe(validVoteData.exposeId);
      expect(data.data.upvotes).toBe(6);
      expect(data.data.downvotes).toBe(2);
      expect(data.data.netVotes).toBe(4);
      expect(data.data.voteType).toBe("upvote");
      expect(data.data.timeRemaining).toBeDefined();
    });

    it("should successfully process a downvote", async () => {
      const downvoteData = { ...validVoteData, voteType: "downvote" };
      const mockUpdatedWithDownvote = { ...mockExpose, downvotes: 3 };
      vi.mocked(Expose.findOneAndUpdate).mockResolvedValue(
        mockUpdatedWithDownvote
      );

      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(downvoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.upvotes).toBe(5);
      expect(data.data.downvotes).toBe(3);
      expect(data.data.netVotes).toBe(2);
      expect(data.data.voteType).toBe("downvote");
    });

    it("should call findOneAndUpdate with correct parameters for upvote", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(Expose.findOneAndUpdate).toHaveBeenCalledWith(
        {
          exposeId: "expose_123_abc",
          expiresAt: { $gt: expect.any(Date) },
        },
        { $inc: { upvotes: 1 } },
        { new: true, runValidators: true }
      );
    });

    it("should call findOneAndUpdate with correct parameters for downvote", async () => {
      const downvoteData = { ...validVoteData, voteType: "downvote" };
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(downvoteData),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(Expose.findOneAndUpdate).toHaveBeenCalledWith(
        {
          exposeId: "expose_123_abc",
          expiresAt: { $gt: expect.any(Date) },
        },
        { $inc: { downvotes: 1 } },
        { new: true, runValidators: true }
      );
    });

    it("should return error for invalid JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
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
      const incompleteData = { exposeId: "test" };
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(incompleteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("MISSING_REQUIRED_FIELDS");
      expect(data.details.missing).toContain("voteType");
    });

    it("should return error for invalid field types", async () => {
      const invalidData = { exposeId: 123, voteType: "upvote" };
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
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

    it("should return error for empty exposeId", async () => {
      const invalidData = { exposeId: "   ", voteType: "upvote" };
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EMPTY_EXPOSE_ID");
    });

    it("should return error for invalid vote type", async () => {
      const invalidData = { exposeId: "test", voteType: "invalid" };
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(invalidData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe("INVALID_VOTE_TYPE");
      expect(data.details.validTypes).toEqual(["upvote", "downvote"]);
      expect(data.details.received).toBe("invalid");
    });

    it("should return error when expose not found", async () => {
      vi.mocked(Expose.findOne).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EXPOSE_NOT_FOUND_OR_EXPIRED");
      expect(data.details.exposeId).toBe("expose_123_abc");
    });

    it("should return error when expose expires during vote processing", async () => {
      vi.mocked(Expose.findOneAndUpdate).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(410);
      expect(data.success).toBe(false);
      expect(data.code).toBe("EXPOSE_EXPIRED_DURING_VOTE");
    });

    it("should only find non-expired exposes", async () => {
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(Expose.findOne).toHaveBeenCalledWith({
        exposeId: "expose_123_abc",
        expiresAt: { $gt: expect.any(Date) },
      });
    });

    it("should trim whitespace from exposeId", async () => {
      const dataWithWhitespace = {
        exposeId: "  expose_123_abc  ",
        voteType: "upvote",
      };
      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(dataWithWhitespace),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(Expose.findOne).toHaveBeenCalledWith({
        exposeId: "expose_123_abc",
        expiresAt: { $gt: expect.any(Date) },
      });
    });

    it("should handle database connection errors", async () => {
      vi.mocked(Expose.findOne).mockRejectedValue({
        name: "MongoNetworkError",
        message: "Connection failed",
      });

      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.code).toBe("DATABASE_CONNECTION_ERROR");
    });

    it("should handle database timeout errors", async () => {
      vi.mocked(Expose.findOne).mockRejectedValue({
        name: "MongoTimeoutError",
        message: "Operation timed out",
      });

      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.code).toBe("DATABASE_CONNECTION_ERROR");
    });

    it("should handle database server selection errors", async () => {
      vi.mocked(Expose.findOne).mockRejectedValue({
        name: "MongoServerSelectionError",
        message: "Server unavailable",
      });

      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.code).toBe("DATABASE_UNAVAILABLE");
    });

    it("should handle generic database errors", async () => {
      vi.mocked(Expose.findOne).mockRejectedValue(
        new Error("Generic database error")
      );

      const request = new NextRequest("http://localhost:3000/api/expose/vote", {
        method: "POST",
        body: JSON.stringify(validVoteData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.code).toBe("DATABASE_ERROR");
    });
  });

  describe("Unsupported HTTP Methods", () => {
    it("should return 405 for GET requests", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.code).toBe("METHOD_NOT_ALLOWED");
      expect(data.error).toContain("Use POST to vote");
    });

    it("should return 405 for PUT requests", async () => {
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.code).toBe("METHOD_NOT_ALLOWED");
      expect(data.error).toContain("Use POST to vote");
    });

    it("should return 405 for DELETE requests", async () => {
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.code).toBe("METHOD_NOT_ALLOWED");
      expect(data.error).toContain("Use POST to vote");
    });
  });
});
