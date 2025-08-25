import { ArticleStorageService } from "../article-storage";
import { ProcessedArticle } from "../../types/scraping";

// Mock logger to avoid console output during tests
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("ArticleStorageService", () => {
  let storage: ArticleStorageService;
  let mockArticle: ProcessedArticle;

  beforeEach(() => {
    storage = new ArticleStorageService();
    mockArticle = {
      id: "test-article-1",
      title: "Test Political Article",
      content: "This is test content for a political article.",
      summary: "Test summary",
      author: "Test Author",
      publishDate: "2025-01-26",
      category: "Politics",
      tags: ["politics", "test"],
      imageUrls: ["https://example.com/image.jpg"],
      metadata: {
        scrapingTimestamp: new Date(),
        sourceUrl: "https://example.com/article",
        wordCount: 100,
        estimatedReadTime: 1,
      },
      aiProcessingMetadata: {
        processingTimestamp: new Date(),
        modelUsed: "gemini-2.0-flash-exp",
        confidenceScore: 0.9,
        originalWordCount: 95,
        processedWordCount: 100,
      },
    };
  });

  describe("storeArticle", () => {
    it("should store a single article", () => {
      storage.storeArticle(mockArticle);

      const retrieved = storage.getArticleById("test-article-1");
      expect(retrieved).toEqual(mockArticle);
    });

    it("should update category index when storing article", () => {
      storage.storeArticle(mockArticle);

      const politicsArticles = storage.getArticlesByCategory("Politics");
      expect(politicsArticles).toHaveLength(1);
      expect(politicsArticles[0]).toEqual(mockArticle);
    });
  });

  describe("storeArticles", () => {
    it("should store multiple articles", () => {
      const article2 = {
        ...mockArticle,
        id: "test-article-2",
        title: "Second Article",
      };
      const articles = [mockArticle, article2];

      storage.storeArticles(articles);

      expect(storage.getArticleById("test-article-1")).toEqual(mockArticle);
      expect(storage.getArticleById("test-article-2")).toEqual(article2);
    });
  });

  describe("getArticlesByCategory", () => {
    it("should return articles for specified category", () => {
      const sportsArticle = {
        ...mockArticle,
        id: "sports-1",
        category: "Sports",
        title: "Sports Article",
      };

      storage.storeArticle(mockArticle);
      storage.storeArticle(sportsArticle);

      const politicsArticles = storage.getArticlesByCategory("Politics");
      const sportsArticles = storage.getArticlesByCategory("Sports");

      expect(politicsArticles).toHaveLength(1);
      expect(sportsArticles).toHaveLength(1);
      expect(politicsArticles[0].category).toBe("Politics");
      expect(sportsArticles[0].category).toBe("Sports");
    });

    it("should return empty array for non-existent category", () => {
      const articles = storage.getArticlesByCategory("NonExistent");
      expect(articles).toEqual([]);
    });

    it("should respect limit parameter", () => {
      const articles = Array.from({ length: 5 }, (_, i) => ({
        ...mockArticle,
        id: `article-${i}`,
        title: `Article ${i}`,
      }));

      storage.storeArticles(articles);

      const limitedArticles = storage.getArticlesByCategory("Politics", 3);
      expect(limitedArticles).toHaveLength(3);
    });
  });

  describe("searchArticles", () => {
    it("should find articles by title", () => {
      storage.storeArticle(mockArticle);

      const results = storage.searchArticles("Political");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockArticle);
    });

    it("should find articles by content", () => {
      storage.storeArticle(mockArticle);

      const results = storage.searchArticles("test content");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockArticle);
    });

    it("should find articles by tags", () => {
      storage.storeArticle(mockArticle);

      const results = storage.searchArticles("politics");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockArticle);
    });
  });

  describe("getStorageStats", () => {
    it("should return correct storage statistics", () => {
      const sportsArticle = {
        ...mockArticle,
        id: "sports-1",
        category: "Sports",
      };

      storage.storeArticle(mockArticle);
      storage.storeArticle(sportsArticle);

      const stats = storage.getStorageStats();

      expect(stats.totalArticles).toBe(2);
      expect(stats.categoryCounts.Politics).toBe(1);
      expect(stats.categoryCounts.Sports).toBe(1);
      expect(stats.oldestArticle).toBeInstanceOf(Date);
      expect(stats.newestArticle).toBeInstanceOf(Date);
    });
  });

  describe("clearAll", () => {
    it("should clear all articles from storage", () => {
      storage.storeArticle(mockArticle);
      expect(storage.getArticleById("test-article-1")).toEqual(mockArticle);

      storage.clearAll();
      expect(storage.getArticleById("test-article-1")).toBeNull();
      expect(storage.getAllArticles()).toHaveLength(0);
    });
  });

  describe("getMemoryUsage", () => {
    it("should return memory usage information", () => {
      storage.storeArticle(mockArticle);

      const usage = storage.getMemoryUsage();
      expect(usage.articleCount).toBe(1);
      expect(usage.estimatedSizeKB).toBe(2); // 1 article * 2KB
    });
  });
});
