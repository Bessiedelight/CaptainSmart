import { NextRequest } from "next/server";
import { GET } from "../route";

// Mock article storage
const mockGetTrendingArticles = jest.fn();
const mockGetStorageStats = jest.fn();

jest.mock("@/lib/services/article-storage", () => ({
  articleStorage: {
    getTrendingArticles: mockGetTrendingArticles,
    getStorageStats: mockGetStorageStats,
  },
}));

// Mock utility functions
jest.mock("@/lib/utils/scraping-utils", () => ({
  convertToTrendingCard: jest.fn((article) => ({
    id: article.id,
    image: article.imageUrls[0] || "fallback.jpg",
    title: article.title,
    author: article.author,
    date: article.publishDate,
    tag: article.category,
    readTime: "3 min read",
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

describe("/api/articles/trending", () => {
  const mockTrendingArticles = [
    {
      id: "trending-1",
      title: "Breaking News Story",
      content: "Breaking news content",
      summary: "Breaking news summary",
      author: "News Reporter",
      publishDate: "2025-01-26T12:00:00Z",
      category: "Politics",
      tags: ["breaking", "politics"],
      imageUrls: ["https://example.com/breaking.jpg"],
      metadata: {
        scrapingTimestamp: new Date(),
        sourceUrl: "https://example.com/breaking",
        wordCount: 300,
        estimatedReadTime: 2,
      },
      aiProcessingMetadata: {
        processingTimestamp: new Date(),
        modelUsed: "gemini-2.0-flash-exp",
        confidenceScore: 0.95,
        originalWordCount: 290,
        processedWordCount: 300,
      },
    },
    {
      id: "trending-2",
      title: "Sports Championship Update",
      content: "Sports content",
      summary: "Sports summary",
      author: "Sports Writer",
      publishDate: "2025-01-26T11:00:00Z",
      category: "Sports",
      tags: ["sports", "championship"],
      imageUrls: ["https://example.com/sports.jpg"],
      metadata: {
        scrapingTimestamp: new Date(),
        sourceUrl: "https://example.com/sports",
        wordCount: 250,
        estimatedReadTime: 2,
      },
      aiProcessingMetadata: {
        processingTimestamp: new Date(),
        modelUsed: "gemini-2.0-flash-exp",
        confidenceScore: 0.88,
        originalWordCount: 240,
        processedWordCount: 250,
      },
    },
  ];

  const mockStats = {
    totalArticles: 10,
    categoryCounts: { Politics: 4, Sports: 3, Business: 2, Entertainment: 1 },
    oldestArticle: new Date("2025-01-25"),
    newestArticle: new Date("2025-01-26"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTrendingArticles.mockReturnValue(mockTrendingArticles);
    mockGetStorageStats.mockReturnValue(mockStats);
  });

  describe("GET", () => {
    it("should retrieve trending articles in trending format by default", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.articles)).toBe(true);
      expect(data.data.articles).toHaveLength(2);
      expect(data.data.meta.format).toBe("trending");
      expect(mockGetTrendingArticles).toHaveBeenCalledWith(6);
    });

    it("should return raw articles when format=raw", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending?format=raw"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual(mockTrendingArticles);
      expect(data.data.meta.format).toBe("raw");
    });

    it("should respect custom limit parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending?limit=3"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.meta.limit).toBe(3);
      expect(mockGetTrendingArticles).toHaveBeenCalledWith(3);
    });

    it("should include comprehensive metadata", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.meta).toEqual({
        total: 2,
        totalArticles: 10,
        categoryCounts: mockStats.categoryCounts,
        format: "trending",
        limit: 6,
        lastUpdated: mockStats.newestArticle,
      });
    });

    it("should handle empty trending results", async () => {
      mockGetTrendingArticles.mockReturnValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual([]);
      expect(data.message).toContain("Retrieved 0 trending articles");
    });

    it("should handle storage errors gracefully", async () => {
      mockGetTrendingArticles.mockImplementation(() => {
        throw new Error("Trending storage error");
      });

      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Trending storage error");
    });

    it("should format trending cards correctly", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending?format=trending"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Check that articles are formatted as trending cards
      const firstCard = data.data.articles[0];
      expect(firstCard).toHaveProperty("id");
      expect(firstCard).toHaveProperty("image");
      expect(firstCard).toHaveProperty("title");
      expect(firstCard).toHaveProperty("author");
      expect(firstCard).toHaveProperty("date");
      expect(firstCard).toHaveProperty("tag");
      expect(firstCard).toHaveProperty("readTime");
    });

    it("should include correct response structure", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/trending"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("timestamp");
      expect(data.success).toBe(true);
      expect(typeof data.timestamp).toBe("string");
    });
  });
});
