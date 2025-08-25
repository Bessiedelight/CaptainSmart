import { AIProcessingService } from "../ai-processing";
import { RawArticle } from "../../types/scraping";

// Mock Google Generative AI
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock sleep function
jest.mock("../../utils/scraping-utils", () => ({
  ...jest.requireActual("../../utils/scraping-utils"),
  sleep: jest.fn().mockResolvedValue(undefined),
  generateArticleId: jest.fn().mockReturnValue("test-article-id"),
}));

// Mock environment
jest.mock("../../config/env", () => ({
  env: {
    GEMINI_API_KEY: "test-api-key",
  },
}));

describe("AIProcessingService", () => {
  let service: AIProcessingService;
  let mockRawArticle: RawArticle;
  let mockAIResponse: any;

  beforeEach(() => {
    service = new AIProcessingService();

    mockRawArticle = {
      url: "https://example.com/article",
      title: "Original Political Article Title",
      content:
        "This is the original content of a political article about Ghana. ".repeat(
          20
        ),
      author: "John Doe",
      publishDate: "2025-01-26T10:00:00Z",
      category: "Politics",
      imageUrls: [
        "https://example.com/image1.jpg",
        "https://example.com/image2.png",
      ],
      metadata: {
        scrapingTimestamp: new Date(),
        sourceUrl: "https://example.com/article",
        wordCount: 100,
        estimatedReadTime: 1,
      },
    };

    mockAIResponse = {
      title: "Rewritten Political Article Headline",
      content:
        "This is the rewritten content that maintains factual accuracy while being unique. ".repeat(
          15
        ),
      summary: "This is a concise summary of the rewritten article content.",
      author: "John Doe",
      category: "Politics",
      tags: ["politics", "ghana", "government", "news"],
      imageUrls: [
        "https://example.com/image1.jpg",
        "https://example.com/image2.png",
      ],
      confidenceScore: 0.9,
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("processIndividualArticle", () => {
    it("should process a single article successfully", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockAIResponse),
        },
      });

      const result = await service.processIndividualArticle(mockRawArticle);

      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockAIResponse.title);
      expect(result?.content).toBe(mockAIResponse.content);
      expect(result?.summary).toBe(mockAIResponse.summary);
      expect(result?.author).toBe(mockAIResponse.author);
      expect(result?.category).toBe("Politics");
      expect(result?.tags).toEqual(mockAIResponse.tags);
      expect(result?.imageUrls).toEqual(mockRawArticle.imageUrls); // Should preserve original URLs
      expect(result?.aiProcessingMetadata).toBeDefined();
    });

    it("should preserve image URLs exactly from original article", async () => {
      const responseWithDifferentImages = {
        ...mockAIResponse,
        imageUrls: ["https://different.com/image.jpg"], // AI tries to change images
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(responseWithDifferentImages),
        },
      });

      const result = await service.processIndividualArticle(mockRawArticle);

      // Should preserve original image URLs, not the ones from AI response
      expect(result?.imageUrls).toEqual(mockRawArticle.imageUrls);
      expect(result?.imageUrls).not.toEqual(
        responseWithDifferentImages.imageUrls
      );
    });

    it("should handle AI processing errors gracefully", async () => {
      mockGenerateContent.mockRejectedValue(new Error("AI service error"));

      const result = await service.processIndividualArticle(mockRawArticle);

      expect(result).toBeNull();
    });

    it("should handle invalid AI responses", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              title: "", // Invalid: too short
              content: "Short", // Invalid: too short
              summary: "",
            }),
        },
      });

      const result = await service.processIndividualArticle(mockRawArticle);

      expect(result).toBeNull();
    });

    it("should handle malformed JSON responses", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "This is not valid JSON",
        },
      });

      const result = await service.processIndividualArticle(mockRawArticle);

      expect(result).toBeNull();
    });
  });

  describe("processBatch", () => {
    it("should process multiple articles in batch", async () => {
      const articles = [
        mockRawArticle,
        { ...mockRawArticle, url: "https://example.com/article2" },
      ];
      const batchResponse = [
        { index: 0, ...mockAIResponse },
        { index: 1, ...mockAIResponse, title: "Second Article Title" },
      ];

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(batchResponse),
        },
      });

      const results = await service.processBatch(articles);

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe(mockAIResponse.title);
      expect(results[1].title).toBe("Second Article Title");
    });

    it("should fallback to individual processing on batch failure", async () => {
      const articles = [mockRawArticle];

      // First call (batch) fails
      mockGenerateContent.mockRejectedValueOnce(
        new Error("Batch processing failed")
      );

      // Second call (individual) succeeds
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockAIResponse),
        },
      });

      const results = await service.processBatch(articles);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe(mockAIResponse.title);
    });
  });

  describe("standardizeCategory", () => {
    it("should standardize category names correctly", () => {
      const testCases = [
        { input: "politics", expected: "Politics" },
        { input: "POLITICS", expected: "Politics" },
        { input: "political", expected: "Politics" },
        { input: "sports", expected: "Sports" },
        { input: "sport", expected: "Sports" },
        { input: "business", expected: "Business" },
        { input: "economy", expected: "Business" },
        { input: "entertainment", expected: "Entertainment" },
        { input: "random", expected: "General" },
        { input: "", expected: "General" },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = (service as any).standardizeCategory(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe("generateTags", () => {
    it("should generate relevant tags based on content and category", () => {
      const content =
        "This article discusses Ghana politics and government policies";
      const category = "Politics";

      const tags = service.generateTags(content, category);

      expect(tags).toContain("politics");
      expect(tags).toContain("government");
      expect(tags).toContain("ghana");
      expect(tags.length).toBeLessThanOrEqual(5);
    });

    it("should generate default tags for unknown category", () => {
      const content = "General news content";
      const category = "Unknown";

      const tags = service.generateTags(content, category);

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    });
  });

  describe("testProcessing", () => {
    it("should test processing with detailed logging", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockAIResponse),
        },
      });

      const result = await service.testProcessing(mockRawArticle);

      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockAIResponse.title);

      // Verify logging was called
      const { logger } = require("../../utils/logger");
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Testing AI processing for article")
      );
    });
  });

  describe("getProcessingStats", () => {
    it("should return processing statistics", () => {
      const stats = service.getProcessingStats();

      expect(stats).toHaveProperty("totalProcessed");
      expect(stats).toHaveProperty("successRate");
      expect(stats).toHaveProperty("averageConfidenceScore");
      expect(typeof stats.successRate).toBe("number");
      expect(typeof stats.averageConfidenceScore).toBe("number");
    });
  });

  describe("validation", () => {
    it("should validate processed articles correctly", () => {
      const validArticle = {
        id: "test-id",
        title: "Valid Article Title That Is Long Enough",
        content:
          "This is valid content that is definitely long enough to pass validation. ".repeat(
            5
          ),
        summary: "This is a valid summary that is long enough.",
        author: "Test Author",
        publishDate: "2025-01-26",
        category: "Politics",
        tags: ["tag1", "tag2"],
        imageUrls: ["https://example.com/image.jpg"],
        metadata: mockRawArticle.metadata,
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.9,
          originalWordCount: 100,
          processedWordCount: 120,
        },
      };

      const isValid = (service as any).validateProcessedArticle(validArticle);
      expect(isValid).toBe(true);
    });

    it("should reject invalid processed articles", () => {
      const invalidArticle = {
        id: "test-id",
        title: "Short", // Too short
        content: "Too short", // Too short
        summary: "Short", // Too short
        author: "Test Author",
        publishDate: "2025-01-26",
        category: "",
        tags: "not an array", // Invalid type
        imageUrls: "not an array", // Invalid type
        metadata: mockRawArticle.metadata,
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.9,
          originalWordCount: 100,
          processedWordCount: 120,
        },
      };

      const isValid = (service as any).validateProcessedArticle(invalidArticle);
      expect(isValid).toBe(false);
    });
  });
});
