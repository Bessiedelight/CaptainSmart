import { FrontendIntegrationService } from "../frontend-integration";
import { ProcessedArticle } from "../../types/scraping";
import { describe, beforeEach, it } from "node:test";

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock article storage
const mockGetAllArticles = jest.fn();
const mockGetStorageStats = jest.fn();

jest.mock("../article-storage", () => ({
  articleStorage: {
    getAllArticles: mockGetAllArticles,
    getStorageStats: mockGetStorageStats,
  },
}));

describe("FrontendIntegrationService", () => {
  let service: FrontendIntegrationService;
  let mockArticles: ProcessedArticle[];

  beforeEach(() => {
    service = new FrontendIntegrationService();

    mockArticles = [
      {
        id: "article-1",
        title: "Ghana Politics Update",
        content: "This is a political article about Ghana. ".repeat(20),
        summary: "Political news summary",
        author: "John Doe",
        publishDate: "2025-01-26T10:00:00Z",
        category: "Politics",
        tags: ["politics", "ghana"],
        imageUrls: ["https://example.com/politics.jpg"],
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article1",
          wordCount: 200,
          estimatedReadTime: 1,
        },
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.9,
          originalWordCount: 180,
          processedWordCount: 200,
        },
      },
      {
        id: "article-2",
        title: "Sports News Update",
        content: "This is a sports article. ".repeat(15),
        summary: "Sports news summary",
        author: "Jane Smith",
        publishDate: "2025-01-26T09:00:00Z",
        category: "Sports",
        tags: ["sports", "football"],
        imageUrls: ["https://example.com/sports.jpg"],
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article2",
          wordCount: 150,
          estimatedReadTime: 1,
        },
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.8,
          originalWordCount: 140,
          processedWordCount: 150,
        },
      },
      {
        id: "article-3",
        title: "Another Politics Article",
        content: "Second political article content. ".repeat(25),
        summary: "Second politics summary",
        author: "Bob Wilson",
        publishDate: "2025-01-26T08:00:00Z",
        category: "Politics",
        tags: ["politics", "government"],
        imageUrls: [],
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article3",
          wordCount: 250,
          estimatedReadTime: 2,
        },
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.85,
          originalWordCount: 230,
          processedWordCount: 250,
        },
      },
    ];

    jest.clearAllMocks();
  });

  describe("formatForMainPage", () => {
    it("should format articles correctly for main page", () => {
      const result = service.formatForMainPage(mockArticles);

      expect(result.featured).not.toBeNull();
      expect(result.featured?.title).toBe("Ghana Politics Update");
      expect(result.featured?.size).toBe("large");
      expect(result.featured?.category || result.featured?.tag).toBe(
        "Politics"
      );

      expect(result.sideArticles).toHaveLength(1); // Only one more politics article
      expect(result.sideArticles[0].title).toBe("Another Politics Article");

      expect(result.trending).toHaveLength(3); // All articles as trending
    });

    it("should handle empty articles array", () => {
      const result = service.formatForMainPage([]);

      expect(result.featured).toBeNull();
      expect(result.sideArticles).toHaveLength(0);
      expect(result.trending).toHaveLength(0);
    });

    it("should handle articles without politics category", () => {
      const nonPoliticsArticles = mockArticles.filter(
        (a) => a.category !== "Politics"
      );
      const result = service.formatForMainPage(nonPoliticsArticles);

      expect(result.featured).toBeNull();
      expect(result.sideArticles).toHaveLength(0);
      expect(result.trending).toHaveLength(1); // Sports article
    });

    it("should use fallback image when article has no images", () => {
      const result = service.formatForMainPage(mockArticles);

      // Find the article without images (article-3)
      const articleWithoutImage = result.sideArticles.find(
        (a) => a.title === "Another Politics Article"
      );
      expect(articleWithoutImage?.image).toContain("pexels"); // Should use fallback
    });
  });

  describe("getMainPageData", () => {
    beforeEach(() => {
      mockGetAllArticles.mockReturnValue(mockArticles);
      mockGetStorageStats.mockReturnValue({
        totalArticles: 3,
        categoryCounts: { Politics: 2, Sports: 1 },
        newestArticle: new Date(),
        oldestArticle: new Date(),
      });
    });

    it("should return complete main page data", async () => {
      const result = await service.getMainPageData();

      expect(result.featured).not.toBeNull();
      expect(result.sideArticles).toHaveLength(1);
      expect(result.trending).toHaveLength(3);
      expect(result.stats.totalArticles).toBe(3);
      expect(result.stats.categories).toEqual({ Politics: 2, Sports: 1 });
    });

    it("should handle errors gracefully", async () => {
      mockGetAllArticles.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = await service.getMainPageData();

      expect(result.featured).toBeNull();
      expect(result.sideArticles).toHaveLength(0);
      expect(result.trending).toHaveLength(0);
      expect(result.stats.totalArticles).toBe(0);
    });
  });

  describe("hasFreshContent", () => {
    it("should return true for articles from last 24 hours", () => {
      const freshArticles = mockArticles.map((article) => ({
        ...article,
        metadata: {
          ...article.metadata,
          scrapingTimestamp: new Date(), // Current time
        },
      }));

      const result = service.hasFreshContent(freshArticles);
      expect(result).toBe(true);
    });

    it("should return false for old articles", () => {
      const oldArticles = mockArticles.map((article) => ({
        ...article,
        metadata: {
          ...article.metadata,
          scrapingTimestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        },
      }));

      const result = service.hasFreshContent(oldArticles);
      expect(result).toBe(false);
    });
  });

  describe("getContentFreshness", () => {
    it("should return correct freshness information", () => {
      const result = service.getContentFreshness(mockArticles);

      expect(result).toHaveProperty("isFresh");
      expect(result).toHaveProperty("lastUpdate");
      expect(result).toHaveProperty("articlesCount");
      expect(result.articlesCount).toBe(3);
      expect(typeof result.lastUpdate).toBe("string");
    });
  });

  describe("generateFallbackContent", () => {
    it("should generate fallback content when no articles available", () => {
      const result = service.generateFallbackContent();

      expect(result.featured).toBeDefined();
      expect(result.featured.title).toContain("Smart News");
      expect(result.featured.size).toBe("large");

      expect(result.sideArticles).toHaveLength(2);
      expect(result.sideArticles[0].title).toContain("AI-Powered");

      expect(result.trending).toHaveLength(3);
      expect(result.trending[0].title).toContain("Political News");
    });

    it("should use appropriate fallback images", () => {
      const result = service.generateFallbackContent();

      expect(result.featured.image).toContain("pexels");
      expect(result.sideArticles[0].image).toContain("pexels");
      expect(result.trending[0].image).toContain("pexels");
    });
  });

  describe("private methods", () => {
    it("should extract excerpt correctly", () => {
      const longContent =
        "This is a very long article content that should be truncated. ".repeat(
          10
        );
      const excerpt = (service as any).extractExcerpt(longContent, 100);

      expect(excerpt.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(excerpt).toMatch(/\.\.\.$/);
    });

    it("should format date correctly", () => {
      const dateString = "2025-01-26T10:00:00Z";
      const formatted = (service as any).formatDate(dateString);

      expect(formatted).toMatch(/\d{2} \w{3} \d{4}/); // Format: "26 Jan 2025"
    });

    it("should get fallback image for different categories", () => {
      const politicsImage = (service as any).getFallbackImage("Politics");
      const sportsImage = (service as any).getFallbackImage("Sports");
      const generalImage = (service as any).getFallbackImage("Unknown");

      expect(politicsImage).toContain("pexels");
      expect(sportsImage).toContain("pexels");
      expect(generalImage).toContain("pexels");
      expect(politicsImage).not.toBe(sportsImage);
    });
  });
});
