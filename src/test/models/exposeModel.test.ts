import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import {
  Expose,
  IExpose,
  PREDEFINED_HASHTAGS,
} from "@/databaseModels/exposeModel";

// Mock mongoose connection
vi.mock("@/utils/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe("Expose Model", () => {
  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up any test data
    if (mongoose.connection.readyState === 1) {
      await Expose.deleteMany({});
    }
  });

  describe("Schema Validation", () => {
    it("should create a valid expose with required fields", async () => {
      const exposeData = {
        title: "Test Expose",
        description: "This is a test expose description",
        hashtag: "#corruption",
        imageUrls: ["https://example.com/image1.jpg"],
        audioUrl: "https://example.com/audio.mp3",
      };

      const expose = new Expose(exposeData);

      expect(expose.title).toBe(exposeData.title);
      expect(expose.description).toBe(exposeData.description);
      expect(expose.hashtag).toBe(exposeData.hashtag);
      expect(expose.imageUrls).toEqual(exposeData.imageUrls);
      expect(expose.audioUrl).toBe(exposeData.audioUrl);
      expect(expose.upvotes).toBe(0);
      expect(expose.downvotes).toBe(0);
      expect(expose.exposeId).toMatch(/^expose_\d+_[a-z0-9]{9}$/);
      expect(expose.expiresAt).toBeInstanceOf(Date);
    });

    it("should generate unique exposeId for each instance", () => {
      const expose1 = new Expose({
        title: "Test 1",
        description: "Description 1",
        hashtag: "#test",
      });

      const expose2 = new Expose({
        title: "Test 2",
        description: "Description 2",
        hashtag: "#test",
      });

      expect(expose1.exposeId).not.toBe(expose2.exposeId);
      expect(expose1.exposeId).toMatch(/^expose_\d+_[a-z0-9]{9}$/);
      expect(expose2.exposeId).toMatch(/^expose_\d+_[a-z0-9]{9}$/);
    });

    it("should set expiration date to 4 days from creation", () => {
      const expose = new Expose({
        title: "Test Expose",
        description: "Test description",
        hashtag: "#test",
      });

      const now = new Date();
      const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(
        expose.expiresAt.getTime() - fourDaysLater.getTime()
      );

      // Allow for small time differences (within 1 second)
      expect(timeDiff).toBeLessThan(1000);
    });

    it("should fail validation when required fields are missing", () => {
      const expose = new Expose({});
      const validationError = expose.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors.title).toBeDefined();
      expect(validationError?.errors.description).toBeDefined();
      expect(validationError?.errors.hashtag).toBeDefined();
    });

    it("should fail validation when title exceeds 200 characters", () => {
      const longTitle = "a".repeat(201);
      const expose = new Expose({
        title: longTitle,
        description: "Valid description",
        hashtag: "#test",
      });

      const validationError = expose.validateSync();
      expect(validationError?.errors.title).toBeDefined();
    });

    it("should fail validation when description exceeds 2000 characters", () => {
      const longDescription = "a".repeat(2001);
      const expose = new Expose({
        title: "Valid title",
        description: longDescription,
        hashtag: "#test",
      });

      const validationError = expose.validateSync();
      expect(validationError?.errors.description).toBeDefined();
    });

    it("should fail validation when hashtag does not start with #", () => {
      const expose = new Expose({
        title: "Valid title",
        description: "Valid description",
        hashtag: "invalid_hashtag",
      });

      const validationError = expose.validateSync();
      expect(validationError?.errors.hashtag).toBeDefined();
      expect(validationError?.errors.hashtag.message).toContain(
        "must start with #"
      );
    });

    it("should fail validation when hashtag is too short or too long", () => {
      const shortHashtag = new Expose({
        title: "Valid title",
        description: "Valid description",
        hashtag: "#",
      });

      const longHashtag = new Expose({
        title: "Valid title",
        description: "Valid description",
        hashtag: "#" + "a".repeat(50),
      });

      expect(shortHashtag.validateSync()?.errors.hashtag).toBeDefined();
      expect(longHashtag.validateSync()?.errors.hashtag).toBeDefined();
    });

    it("should fail validation for invalid image URLs", () => {
      const expose = new Expose({
        title: "Valid title",
        description: "Valid description",
        hashtag: "#test",
        imageUrls: ["invalid-url", "also-invalid"],
      });

      const validationError = expose.validateSync();
      expect(validationError?.errors["imageUrls.0"]).toBeDefined();
      expect(validationError?.errors["imageUrls.1"]).toBeDefined();
    });

    it("should fail validation for invalid audio URL", () => {
      const expose = new Expose({
        title: "Valid title",
        description: "Valid description",
        hashtag: "#test",
        audioUrl: "invalid-audio-url",
      });

      const validationError = expose.validateSync();
      expect(validationError?.errors.audioUrl).toBeDefined();
    });

    it("should allow empty audio URL", () => {
      const expose = new Expose({
        title: "Valid title",
        description: "Valid description",
        hashtag: "#test",
        audioUrl: "",
      });

      const validationError = expose.validateSync();
      expect(validationError?.errors.audioUrl).toBeUndefined();
    });

    it("should validate negative vote counts", () => {
      const expose = new Expose({
        title: "Valid title",
        description: "Valid description",
        hashtag: "#test",
        upvotes: -1,
        downvotes: -1,
      });

      const validationError = expose.validateSync();
      expect(validationError?.errors.upvotes).toBeDefined();
      expect(validationError?.errors.downvotes).toBeDefined();
    });
  });

  describe("Virtual Properties", () => {
    it("should calculate netVotes correctly", () => {
      const expose = new Expose({
        title: "Test",
        description: "Test description",
        hashtag: "#test",
        upvotes: 10,
        downvotes: 3,
      });

      expect(expose.netVotes).toBe(7);
    });

    it("should calculate timeRemaining correctly", () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const expose = new Expose({
        title: "Test",
        description: "Test description",
        hashtag: "#test",
        expiresAt: futureDate,
      });

      const timeRemaining = expose.timeRemaining;
      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(2 * 60 * 60 * 1000);
    });

    it("should return 0 for timeRemaining when expired", () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const expose = new Expose({
        title: "Test",
        description: "Test description",
        hashtag: "#test",
        expiresAt: pastDate,
      });

      expect(expose.timeRemaining).toBe(0);
    });

    it("should include virtuals in JSON output", () => {
      const expose = new Expose({
        title: "Test",
        description: "Test description",
        hashtag: "#test",
        upvotes: 5,
        downvotes: 2,
      });

      const json = expose.toJSON();
      expect(json.netVotes).toBe(3);
      expect(json.timeRemaining).toBeDefined();
    });
  });

  describe("Predefined Hashtags", () => {
    it("should export predefined hashtags array", () => {
      expect(PREDEFINED_HASHTAGS).toBeDefined();
      expect(Array.isArray(PREDEFINED_HASHTAGS)).toBe(true);
      expect(PREDEFINED_HASHTAGS.length).toBeGreaterThan(0);
    });

    it("should have all hashtags start with #", () => {
      PREDEFINED_HASHTAGS.forEach((hashtag) => {
        expect(hashtag.startsWith("#")).toBe(true);
      });
    });

    it("should contain expected hashtags", () => {
      const expectedHashtags = [
        "#corruption",
        "#unfair_arrest",
        "#police_brutality",
        "#workplace_harassment",
        "#government_misconduct",
        "#fraud",
        "#discrimination",
        "#abuse_of_power",
      ];

      expectedHashtags.forEach((hashtag) => {
        expect(PREDEFINED_HASHTAGS).toContain(hashtag);
      });
    });
  });

  describe("Model Methods", () => {
    it("should trim whitespace from title and description", () => {
      const expose = new Expose({
        title: "  Test Title  ",
        description: "  Test Description  ",
        hashtag: "#test",
      });

      expect(expose.title).toBe("Test Title");
      expect(expose.description).toBe("Test Description");
    });

    it("should trim whitespace from hashtag", () => {
      const expose = new Expose({
        title: "Test",
        description: "Test description",
        hashtag: "  #test  ",
      });

      expect(expose.hashtag).toBe("#test");
    });
  });
});
