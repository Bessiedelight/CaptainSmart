import { ArticleStorageService } from "../article-storage";
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

// Mock system config
jest.mock("../../config/scraping-config", () => ({
  systemConfig: {
    storage: {
      retentionHours: 24,
      maxArticlesPerCategory: 50,
    },
  },
}));

describe("ArticleStorageService - Maintenance Features", () => {
  let storage: ArticleStorageService;
  let mockArticles: ProcessedArticle[];

  beforeEach(() => {
    storage = new ArticleStorageService();

    // Create test articles with different timestamps
    mockArticles = [
      {
        id: "article-1",
        title: "Recent Article",
        content: "Recent content",
        summary: "Recent summary",
        author: "Author 1",
        publishDate: "2025-01-26T10:00:00Z",
        category: "Politics",
        tags: ["politics", "recent"],
        imageUrls: ["https://example.com/image1.jpg"],
        metadata: {
          scrapingTimestamp: new Date(), // Current time
          sourceUrl: "https://example.com/article1",
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
      },
      {
        id: "article-2",
        title: "Old Article",
        content: "Old content",
        summary: "Old summary",
        author: "Author 2",
        publishDate: "2025-01-25T10:00:00Z",
        category: "Sports",
        tags: ["sports", "old"],
        imageUrls: ["https://example.com/image2.jpg"],
        metadata: {
          scrapingTimestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
          sourceUrl: "https://example.com/article2",
          wordCount: 150,
          estimatedReadTime: 1,
        },
        aiProcessingMetadata: {
          processingTimestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.8,
          originalWordCount: 140,
          processedWordCount: 150,
        },
      },
      {
        id: "article-3",
        title: "Duplicate Article Title",
        content: "Duplicate content",
        summary: "Duplicate summary",
        author: "Author 3",
        publishDate: "2025-01-26T09:00:00Z",
        category: "Politics",
        tags: ["politics", "duplicate"],
        imageUrls: ["https://example.com/image3.jpg"],
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article3",
          wordCount: 120,
          estimatedReadTime: 1,
        },
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.85,
          originalWordCount: 115,
          processedWordCount: 120,
        },
      },
      {
        id: "article-4",
        title: "Duplicate Article Title", // Same title as article-3
        content: "Another duplicate content",
        summary: "Another duplicate summary",
        author: "Author 4",
        publishDate: "2025-01-26T08:00:00Z", // Older than article-3
        category: "Politics",
        tags: ["politics", "duplicate"],
        imageUrls: ["https://example.com/image4.jpg"],
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article4",
          wordCount: 110,
          estimatedReadTime: 1,
        },
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.82,
          originalWordCount: 105,
          processedWordCount: 110,
        },
      },
    ];

    // Store test articles
    storage.storeArticles(mockArticles);
  });

  describe("performMaintenance", () => {
    it("should perform comprehensive maintenance operations", () => {
      const result = storage.performMaintenance();

      expect(result).toHaveProperty("oldArticlesRemoved");
      expect(result).toHaveProperty("duplicatesRemoved");
      expect(result).toHaveProperty("memoryOptimized");
      expect(result).toHaveProperty("indexesRebuilt");

      expect(typeof result.oldArticlesRemoved).toBe("number");
      expect(typeof result.duplicatesRemoved).toBe("number");
      expect(typeof result.memoryOptimized).toBe("boolean");
      expect(typeof result.indexesRebuilt).toBe("boolean");
    });

    it("should remove old articles during maintenance", () => {
      const result = storage.performMaintenance();

      // Should remove the old article (48 hours old)
      expect(result.oldArticlesRemoved).toBe(1);

      // Verify the old article is actually removed
      const remainingArticles = storage.getAllArticles();
      expect(
        remainingArticles.find((a) => a.id === "article-2")
      ).toBeUndefined();
    });

    it("should remove duplicate articles during maintenance", () => {
      const result = storage.performMaintenance();

      // Should remove one duplicate (the older one)
      expect(result.duplicatesRemoved).toBe(1);

      // Verify only one article with the duplicate title remains
      const remainingArticles = storage.getAllArticles();
      const duplicateTitleArticles = remainingArticles.filter(
        (a) => a.title === "Duplicate Article Title"
      );
      expect(duplicateTitleArticles).toHaveLength(1);

      // Should keep the newer article (article-3)
      expect(duplicateTitleArticles[0].id).toBe("article-3");
    });

    it("should rebuild indexes during maintenance", () => {
      const result = storage.performMaintenance();

      expect(result.indexesRebuilt).toBe(true);

      // Verify indexes are working correctly after rebuild
      const politicsArticles = storage.getArticlesByCategory("Politics");
      expect(politicsArticles.length).toBeGreaterThan(0);
    });
  });

  describe("getMaintenanceStats", () => {
    it("should return maintenance statistics", () => {
      // Perform some maintenance operations first
      storage.performMaintenance();

      const stats = storage.getMaintenanceStats();

      expect(stats).toHaveProperty("totalCleanups");
      expect(stats).toHaveProperty("articlesRemoved");
      expect(stats).toHaveProperty("duplicatesRemoved");
      expect(stats).toHaveProperty("lastMaintenance");
      expect(stats).toHaveProperty("memoryOptimizations");
      expect(stats).toHaveProperty("nextScheduledMaintenance");

      expect(stats.totalCleanups).toBeGreaterThan(0);
      expect(stats.lastMaintenance).toBeInstanceOf(Date);
      expect(stats.nextScheduledMaintenance).toBeInstanceOf(Date);
    });

    it("should calculate next scheduled maintenance correctly", () => {
      const stats = storage.getMaintenanceStats();
      const expectedNext = new Date(
        stats.lastMaintenance.getTime() + 6 * 60 * 60 * 1000
      );

      expect(stats.nextScheduledMaintenance.getTime()).toBe(
        expectedNext.getTime()
      );
    });
  });

  describe("isMaintenanceNeeded", () => {
    it("should detect when maintenance is needed", () => {
      const check = storage.isMaintenanceNeeded();

      expect(check).toHaveProperty("needed");
      expect(check).toHaveProperty("reasons");
      expect(check).toHaveProperty("priority");

      expect(typeof check.needed).toBe("boolean");
      expect(Array.isArray(check.reasons)).toBe(true);
      expect(["low", "medium", "high"]).toContain(check.priority);
    });

    it("should detect old articles needing cleanup", () => {
      const check = storage.isMaintenanceNeeded();

      expect(check.needed).toBe(true);
      expect(
        check.reasons.some((reason) => reason.includes("old articles"))
      ).toBe(true);
    });

    it("should return appropriate priority levels", () => {
      // Add many articles to trigger high priority
      const manyArticles = Array.from({ length: 300 }, (_, i) => ({
        ...mockArticles[0],
        id: `bulk-article-${i}`,
        title: `Bulk Article ${i}`,
      }));

      storage.storeArticles(manyArticles);

      const check = storage.isMaintenanceNeeded();
      expect(check.priority).toBe("high");
      expect(
        check.reasons.some((reason) =>
          reason.includes("exceeds recommended limits")
        )
      ).toBe(true);
    });
  });

  describe("autoMaintenance", () => {
    it("should perform maintenance when needed with medium/high priority", () => {
      const performed = storage.autoMaintenance();

      // Should perform maintenance due to old articles
      expect(performed).toBe(true);
    });

    it("should not perform maintenance when priority is low", () => {
      // First clean up to remove the need for maintenance
      storage.performMaintenance();

      const performed = storage.autoMaintenance();
      expect(performed).toBe(false);
    });
  });

  describe("refreshStaleContent", () => {
    it("should refresh stale content timestamps", () => {
      // Create an article with old scraping timestamp
      const staleArticle: ProcessedArticle = {
        ...mockArticles[0],
        id: "stale-article",
        metadata: {
          ...mockArticles[0].metadata,
          scrapingTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      };

      storage.storeArticle(staleArticle);

      const refreshedCount = storage.refreshStaleContent();
      expect(refreshedCount).toBeGreaterThan(0);

      // Verify the timestamp was updated
      const refreshedArticle = storage.getArticleById("stale-article");
      expect(
        refreshedArticle?.metadata.scrapingTimestamp.getTime()
      ).toBeGreaterThan(
        Date.now() - 1000 // Within the last second
      );
    });
  });

  describe("getStorageHealthReport", () => {
    it("should generate comprehensive health report", () => {
      const report = storage.getStorageHealthReport();

      expect(report).toHaveProperty("status");
      expect(report).toHaveProperty("issues");
      expect(report).toHaveProperty("recommendations");
      expect(report).toHaveProperty("stats");
      expect(report).toHaveProperty("maintenance");
      expect(report).toHaveProperty("memory");

      expect(["healthy", "warning", "critical"]).toContain(report.status);
      expect(Array.isArray(report.issues)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it("should detect health issues correctly", () => {
      // Add many articles to trigger memory warning
      const manyArticles = Array.from({ length: 100 }, (_, i) => ({
        ...mockArticles[0],
        id: `memory-test-${i}`,
        title: `Memory Test Article ${i}`,
      }));

      storage.storeArticles(manyArticles);

      const report = storage.getStorageHealthReport();

      if (report.memory.estimatedSizeKB > 10000) {
        expect(report.status).not.toBe("healthy");
        expect(report.issues.some((issue) => issue.includes("memory"))).toBe(
          true
        );
      }
    });

    it("should provide appropriate recommendations", () => {
      const report = storage.getStorageHealthReport();

      if (report.issues.length > 0) {
        expect(report.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("memory optimization", () => {
    it("should optimize memory usage", () => {
      // Create and then remove a custom category to test cleanup
      const customArticle: ProcessedArticle = {
        ...mockArticles[0],
        id: "custom-category-article",
        category: "CustomCategory",
      };

      storage.storeArticle(customArticle);
      storage.removeArticle("custom-category-article");

      const result = storage.performMaintenance();
      expect(result.memoryOptimized).toBe(true);
    });
  });

  describe("index rebuilding", () => {
    it("should rebuild category indexes correctly", () => {
      // Corrupt the indexes by clearing them
      (storage as any).categoryIndex.clear();

      const result = storage.performMaintenance();
      expect(result.indexesRebuilt).toBe(true);

      // Verify indexes work after rebuild
      const politicsArticles = storage.getArticlesByCategory("Politics");
      expect(politicsArticles.length).toBeGreaterThan(0);
    });
  });
});
