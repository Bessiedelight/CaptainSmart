import { WebsiteDiscoveryService } from "../website-discovery";
import { WebsiteConfig } from "../../types/scraping";

// Mock puppeteer
const mockPage = {
  setUserAgent: jest.fn(),
  goto: jest.fn(),
  evaluate: jest.fn(),
  close: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};

jest.mock("puppeteer", () => ({
  launch: jest.fn().mockResolvedValue(mockBrowser),
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
}));

describe("WebsiteDiscoveryService", () => {
  let service: WebsiteDiscoveryService;
  let mockWebsiteConfig: WebsiteConfig;

  beforeEach(() => {
    service = new WebsiteDiscoveryService();
    mockWebsiteConfig = {
      name: "TestSite",
      baseUrl: "https://example.com",
      categoryPages: ["/politics/", "/news/"],
      selectors: {
        articleLinks: 'a[href*="/article/"]',
        title: "h1",
        content: ".content",
        author: ".author",
        publishDate: ".date",
        images: "img",
      },
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await service.closeBrowser();
  });

  describe("initBrowser", () => {
    it("should initialize browser successfully", async () => {
      await service.initBrowser();

      const puppeteer = require("puppeteer");
      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: expect.arrayContaining([
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ]),
      });
    });
  });

  describe("validateArticleUrl", () => {
    it("should validate correct article URLs", () => {
      const validUrls = [
        "https://example.com/news/article-123",
        "https://example.com/politics/politik-news",
        "https://example.com/NewsArchive/artikel.php?id=123",
      ];

      validUrls.forEach((url) => {
        expect(service.validateArticleUrl(url, mockWebsiteConfig)).toBe(true);
      });
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = [
        "https://otherdomain.com/news/article",
        "https://example.com/search/query",
        "https://example.com/category/politics",
        "https://example.com/image.jpg",
        "javascript:void(0)",
        "mailto:test@example.com",
        "https://example.com/article#comment",
      ];

      invalidUrls.forEach((url) => {
        expect(service.validateArticleUrl(url, mockWebsiteConfig)).toBe(false);
      });
    });

    it("should reject URLs from different domains", () => {
      const url = "https://different-site.com/news/article";
      expect(service.validateArticleUrl(url, mockWebsiteConfig)).toBe(false);
    });
  });

  describe("filterDuplicateUrls", () => {
    it("should remove duplicate URLs", () => {
      const urls = [
        "https://example.com/article1",
        "https://example.com/article2",
        "https://example.com/article1", // duplicate
        "https://example.com/article3",
      ];

      const filtered = service.filterDuplicateUrls(urls);
      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual([
        "https://example.com/article1",
        "https://example.com/article2",
        "https://example.com/article3",
      ]);
    });

    it("should maintain order of first occurrence", () => {
      const urls = [
        "https://example.com/article2",
        "https://example.com/article1",
        "https://example.com/article2", // duplicate
      ];

      const filtered = service.filterDuplicateUrls(urls);
      expect(filtered).toEqual([
        "https://example.com/article2",
        "https://example.com/article1",
      ]);
    });
  });

  describe("discoverArticleUrls", () => {
    beforeEach(async () => {
      await service.initBrowser();
    });

    it("should discover URLs from category pages", async () => {
      // Mock page.evaluate to return some URLs
      mockPage.evaluate.mockResolvedValue([
        "https://example.com/news/article1",
        "https://example.com/politics/article2",
      ]);

      const urls = await service.discoverArticleUrls(
        mockWebsiteConfig.baseUrl,
        mockWebsiteConfig.categoryPages,
        mockWebsiteConfig
      );

      expect(mockPage.goto).toHaveBeenCalledTimes(2); // Two category pages
      expect(urls.length).toBeGreaterThan(0);
    });

    it("should handle page navigation errors gracefully", async () => {
      mockPage.goto.mockRejectedValue(new Error("Navigation failed"));

      const urls = await service.discoverArticleUrls(
        mockWebsiteConfig.baseUrl,
        mockWebsiteConfig.categoryPages,
        mockWebsiteConfig
      );

      // Should not throw error, just return empty array
      expect(urls).toEqual([]);
    });
  });

  describe("getDiscoveryStats", () => {
    it("should return correct statistics", () => {
      const urls = [
        "https://example.com/article1",
        "https://example.com/article2",
      ];

      service.filterDuplicateUrls(urls);
      const stats = service.getDiscoveryStats();

      expect(stats.totalDiscovered).toBe(2);
      expect(stats.uniqueUrls).toBe(2);
    });
  });

  describe("clearDiscoveredUrls", () => {
    it("should clear the discovered URLs cache", () => {
      const urls = ["https://example.com/article1"];
      service.filterDuplicateUrls(urls);

      let stats = service.getDiscoveryStats();
      expect(stats.totalDiscovered).toBe(1);

      service.clearDiscoveredUrls();
      stats = service.getDiscoveryStats();
      expect(stats.totalDiscovered).toBe(0);
    });
  });
});
