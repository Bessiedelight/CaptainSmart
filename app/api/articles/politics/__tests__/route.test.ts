import { NextRequest } from "next/server";
import { GET } from "../route";

// Mock article storage
const mockGetArticlesByCategory = jest.fn();
const mockGetStorageStats = jest.fn();

jest.mock("@/lib/services/article-storage", () => ({
  articleStorage: {
    getArticlesByCategory: mockGetArticlesByCategory,
    getStorageStats: mockGetStorageStats,
  },
}));

// Mock utility functions
jest.mock("@/lib/utils/scraping-utils", () => ({
  convertToNewsCard: jest.fn((article) => ({
    id: article.id,
    image: article.imageUrls[0] || "fallback.jpg",
    title: article.title,
    excerpt: article.summary,
    author: article.author,
    date: article.publishDate,
    tag: article.category,
    readTime: "2 min read",
  })),
  convertToTrendingCard: jest.fn((article) => ({
    id: article.id,
    image: article.imageUrls[0] || "fallback.jpg",
    title: article.title,
    author: article.author,
    date: article.publishDate,
    tag: article.category,
    readTime: "2 min read",
  })),
}));

// Mock logger
jest.mock("@/lib/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("/api/articles/politics", () => {
  const mockPoliticsArticles = [
    {
      id: "politics-1",
      title: "Ghana Election Update",
      content: "Political content",
      summary: "Election summary",
      author: "Political Reporter",
      publishDate: "2025-01-26",
      category: "Politics",
      tags: ["politics", "election"],
      imageUrls: ["https://example.com/politics1.jpg"],
      metadata: {
        scrapingTimestamp: new Date(),
        sourceUrl: "https://example.com/politics1",
        wordCount: 200,
        estimatedReadTime: 1,
      },
      aiProcessingMetadata: {
        processingTimestamp: new Date(),
        modelUsed: "gemini-2.0-flash-exp",
        confidenceScore: 0.9,
        originalWordCount: 190,
        processedWordCount: 200,
      },
    },
    {
      id: "politics-2",
      title: "Government Policy Changes",
      content: "Policy content",
      summary: "Policy summary",
      author: "Policy Analyst",
      publishDate: "2025-01-25",
      category: "Politics",
      tags: ["politics", "policy"],
      imageUrls: ["https://example.com/politics2.jpg"],
      metadata: {
        scrapingTimestamp: new Date(),
        sourceUrl: "https://example.com/politics2",
        wordCount: 250,
        estimatedReadTime: 2,
      },
      aiProcessingMetadata: {
        processingTimestamp: new Date(),
        modelUsed: "gemini-2.0-flash-exp",
        confidenceScore: 0.85,
        originalWordCount: 240,
        processedWordCount: 250,
      },
    },
  ];

  const mockStats = {
    totalArticles: 5,
    categoryCounts: { Politics: 2, Sports: 2, Business: 1 },
    oldestArticle: new Date(),
    newestArticle: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetArticlesByCategory.mockReturnValue(mockPoliticsArticles);
    mockGetStorageStats.mockReturnValue(mockStats);
  });

  describe("GET", () => {
    it("should retrieve politics articles in raw format by default", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual(mockPoliticsArticles);
      expect(data.data.meta.format).toBe("raw");
      expect(mockGetArticlesByCategory).toHaveBeenCalledWith("Politics", 20);
    });

    it("should format articles as cards when format=cards", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics?format=cards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toHaveProperty("featured");
      expect(data.data.articles).toHaveProperty("articles");
      expect(data.data.articles.featured).toBeDefined();
      expect(Array.isArray(data.data.articles.articles)).toBe(true);
    });

    it("should format articles as trending cards when format=trending", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics?format=trending"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.articles)).toBe(true);
      expect(data.data.articles).toHaveLength(2);
    });

    it("should respect limit parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics?limit=1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.meta.limit).toBe(1);
      expect(mockGetArticlesByCategory).toHaveBeenCalledWith("Politics", 1);
    });

    it("should include correct metadata", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.meta).toEqual({
        total: 2,
        totalInCategory: 2,
        format: "raw",
        limit: 20,
        lastUpdated: mockStats.newestArticle,
      });
    });

    it("should handle empty results", async () => {
      mockGetArticlesByCategory.mockReturnValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual([]);
      expect(data.message).toContain("Retrieved 0 political articles");
    });

    it("should handle storage errors gracefully", async () => {
      mockGetArticlesByCategory.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Storage error");
    });

    it("should handle cards format with no articles", async () => {
      mockGetArticlesByCategory.mockReturnValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/politics?format=cards"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles.featured).toBeNull();
      expect(data.data.articles.articles).toEqual([]);
    });
  });
});
