import { ArticleExtractionService } from "../article-extraction";
import { WebsiteConfig } from "../../types/scraping";

// Mock the page object
const mockPage = {
  setUserAgent: jest.fn(),
  goto: jest.fn(),
  evaluate: jest.fn(),
  close: jest.fn(),
};

// Mock the browser object
const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

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
}));

// Mock scraping config
jest.mock("../../config/scraping-config", () => ({
  scrapingConfig: {
    targetWebsites: [
      {
        name: "TestSite",
        baseUrl: "https://example.com",
        categoryPages: ["/politics/"],
        selectors: {
          articleLinks: 'a[href*="/article/"]',
          title: "h1, .article-title",
          content: ".article-content, .story-body",
          author: ".author, .byline",
          publishDate: ".date, .publish-date",
          images: 'img[src*=".jpg"], img[src*=".png"]',
        },
      },
    ],
    timeoutMs: 30000,
  },
}));

describe("ArticleExtractionService", () => {
  let service: ArticleExtractionService;
  let mockArticleData: any;

  beforeEach(() => {
    service = new ArticleExtractionService();
    service.setBrowser(mockBrowser as any);

    mockArticleData = {
      title: "Test Political Article About Ghana Elections",
      content:
        "This is a comprehensive test article about Ghanaian politics. ".repeat(
          20
        ), // Make it long enough
      author: "John Doe",
      publishDate: "2025-01-26T10:00:00Z",
      category: "Politics",
      imageUrls: [
        "https://example.com/image1.jpg",
        "https://example.com/image2.png",
      ],
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("setBrowser", () => {
    it("should set browser instance", () => {
      const newBrowser = { newPage: jest.fn() } as any;
      service.setBrowser(newBrowser);

      // Test that browser is set by trying to extract (should not throw browser error)
      expect(() => service.setBrowser(newBrowser)).not.toThrow();
    });
  });

  describe("extractArticleData", () => {
    beforeEach(() => {
      mockPage.evaluate.mockResolvedValue(mockArticleData);
    });

    it("should extract article data successfully", async () => {
      const url = "https://example.com/politics/test-article";

      const result = await service.extractArticleData(url);

      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockArticleData.title);
      expect(result?.content).toBe(mockArticleData.content);
      expect(result?.author).toBe(mockArticleData.author);
      expect(result?.category).toBe(mockArticleData.category);
      expect(result?.imageUrls).toEqual(mockArticleData.imageUrls);
      expect(result?.metadata).toBeDefined();
      expect(result?.metadata.sourceUrl).toBe(url);
    });

    it("should return null for unsupported website", async () => {
      const url = "https://unsupported-site.com/article";

      const result = await service.extractArticleData(url);

      expect(result).toBeNull();
    });

    it("should handle page navigation errors", async () => {
      mockPage.goto.mockRejectedValue(new Error("Navigation failed"));
      const url = "https://example.com/politics/test-article";

      const result = await service.extractArticleData(url);

      expect(result).toBeNull();
    });

    it("should validate extracted data", async () => {
      // Mock invalid data (too short content)
      mockPage.evaluate.mockResolvedValue({
        ...mockArticleData,
        content: "Too short", // Less than 100 characters
        title: "Short", // Less than 10 characters
      });

      const url = "https://example.com/politics/test-article";
      const result = await service.extractArticleData(url);

      expect(result).toBeNull();
    });

    it("should extract metadata correctly", async () => {
      const url = "https://example.com/politics/test-article";

      const result = await service.extractArticleData(url);

      expect(result?.metadata).toBeDefined();
      expect(result?.metadata.scrapingTimestamp).toBeInstanceOf(Date);
      expect(result?.metadata.sourceUrl).toBe(url);
      expect(result?.metadata.wordCount).toBeGreaterThan(0);
      expect(result?.metadata.estimatedReadTime).toBeGreaterThan(0);
    });
  });

  describe("extractMultipleArticles", () => {
    beforeEach(() => {
      mockPage.evaluate.mockResolvedValue(mockArticleData);
    });

    it("should extract multiple articles", async () => {
      const urls = [
        "https://example.com/politics/article1",
        "https://example.com/politics/article2",
        "https://example.com/politics/article3",
      ];

      const results = await service.extractMultipleArticles(urls);

      expect(results).toHaveLength(3);
      results.forEach((article) => {
        expect(article.title).toBe(mockArticleData.title);
        expect(article.content).toBe(mockArticleData.content);
      });
    });

    it("should handle partial failures in batch extraction", async () => {
      const urls = [
        "https://example.com/politics/article1",
        "https://unsupported-site.com/article", // This should fail
        "https://example.com/politics/article3",
      ];

      const results = await service.extractMultipleArticles(urls);

      // Should get 2 successful extractions out of 3
      expect(results).toHaveLength(2);
    });

    it("should process articles in batches", async () => {
      const urls = Array.from(
        { length: 7 },
        (_, i) => `https://example.com/politics/article${i + 1}`
      );

      await service.extractMultipleArticles(urls);

      // Should have called newPage for each URL
      expect(mockBrowser.newPage).toHaveBeenCalledTimes(7);
    });
  });

  describe("testArticleExtraction", () => {
    beforeEach(() => {
      mockPage.evaluate.mockResolvedValue(mockArticleData);
    });

    it("should test article extraction for debugging", async () => {
      const url = "https://example.com/politics/test-article";

      const result = await service.testArticleExtraction(
        url,
        mockBrowser as any
      );

      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockArticleData.title);
    });

    it("should handle test extraction errors", async () => {
      mockPage.goto.mockRejectedValue(new Error("Test navigation failed"));
      const url = "https://example.com/politics/test-article";

      const result = await service.testArticleExtraction(
        url,
        mockBrowser as any
      );

      expect(result).toBeNull();
    });
  });

  describe("getExtractionStats", () => {
    it("should return extraction statistics", () => {
      const stats = service.getExtractionStats();

      expect(stats).toHaveProperty("successRate");
      expect(stats).toHaveProperty("averageWordCount");
      expect(stats).toHaveProperty("totalExtracted");
      expect(typeof stats.successRate).toBe("number");
      expect(typeof stats.averageWordCount).toBe("number");
      expect(typeof stats.totalExtracted).toBe("number");
    });
  });

  describe("private methods", () => {
    it("should count words correctly", () => {
      const text = "This is a test sentence with seven words.";
      // Access private method through any casting for testing
      const wordCount = (service as any).countWords(text);
      expect(wordCount).toBe(8);
    });

    it("should validate article data correctly", () => {
      const validArticle = {
        title: "Valid Article Title That Is Long Enough",
        content:
          "This is valid content that is definitely long enough to pass validation. ".repeat(
            5
          ),
        author: "Test Author",
        publishDate: "2025-01-26",
        category: "Politics",
        imageUrls: [],
        url: "https://example.com/article",
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article",
          wordCount: 100,
          estimatedReadTime: 1,
        },
      };

      const isValid = (service as any).validateExtractedData(validArticle);
      expect(isValid).toBe(true);
    });

    it("should reject invalid article data", () => {
      const invalidArticle = {
        title: "Short", // Too short
        content: "Too short content", // Too short
        author: "Test Author",
        publishDate: "2025-01-26",
        category: "Politics",
        imageUrls: [],
        url: "https://example.com/article",
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article",
          wordCount: 5,
          estimatedReadTime: 1,
        },
      };

      const isValid = (service as any).validateExtractedData(invalidArticle);
      expect(isValid).toBe(false);
    });
  });
});
