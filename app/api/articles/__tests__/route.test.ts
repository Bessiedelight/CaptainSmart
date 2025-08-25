import { NextRequest } from "next/server";
import { GET } from "../route";

// Mock article storage
const mockGetAllArticles = jest.fn();
const mockGetArticlesByCategory = jest.fn();
const mockSearchArticles = jest.fn();
const mockGetArticlesByTag = jest.fn();
const mockGetStorageStats = jest.fn();

jest.mock("@/lib/services/article-storage", () => ({
  articleStorage: {
    getAllArticles: mockGetAllArticles,
    getArticlesByCategory: mockGetArticlesByCategory,
    searchArticles: mockSearchArticles,
    getArticlesByTag: mockGetArticlesByTag,
    getStorageStats: mockGetStorageStats,
  },
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

describe("/api/articles", () => {
  const mockArticles = [
    {
      id: "article-1",
      title: "Test Article 1",
      content: "Content 1",
      summary: "Summary 1",
      author: "Author 1",
      publishDate: "2025-01-26",
      category: "Politics",
      tags: ["politics", "test"],
      imageUrls: ["https://example.com/image1.jpg"],
      metadata: {
        scrapingTimestamp: new Date(),
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
      title: "Test Article 2",
      content: "Content 2",
      summary: "Summary 2",
      author: "Author 2",
      publishDate: "2025-01-26",
      category: "Sports",
      tags: ["sports", "test"],
      imageUrls: ["https://example.com/image2.jpg"],
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
  ];

  const mockStats = {
    totalArticles: 2,
    categoryCounts: { Politics: 1, Sports: 1 },
    oldestArticle: new Date(),
    newestArticle: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStorageStats.mockReturnValue(mockStats);
  });

  describe("GET", () => {
    it("should retrieve all articles when no filters provided", async () => {
      mockGetAllArticles.mockReturnValue(mockArticles);

      const request = new NextRequest("http://localhost:3000/api/articles");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual(mockArticles);
      expect(data.data.stats).toEqual(mockStats);
      expect(mockGetAllArticles).toHaveBeenCalledWith(undefined);
    });

    it("should filter articles by category", async () => {
      const politicsArticles = [mockArticles[0]];
      mockGetArticlesByCategory.mockReturnValue(politicsArticles);

      const request = new NextRequest(
        "http://localhost:3000/api/articles?category=Politics"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual(politicsArticles);
      expect(data.data.filters.category).toBe("Politics");
      expect(mockGetArticlesByCategory).toHaveBeenCalledWith(
        "Politics",
        undefined
      );
    });

    it("should search articles by query", async () => {
      const searchResults = [mockArticles[0]];
      mockSearchArticles.mockReturnValue(searchResults);

      const request = new NextRequest(
        "http://localhost:3000/api/articles?search=politics"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual(searchResults);
      expect(data.data.filters.search).toBe("politics");
      expect(mockSearchArticles).toHaveBeenCalledWith("politics", undefined);
    });

    it("should filter articles by tag", async () => {
      const tagResults = [mockArticles[1]];
      mockGetArticlesByTag.mockReturnValue(tagResults);

      const request = new NextRequest(
        "http://localhost:3000/api/articles?tag=sports"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.articles).toEqual(tagResults);
      expect(data.data.filters.tag).toBe("sports");
      expect(mockGetArticlesByTag).toHaveBeenCalledWith("sports", undefined);
    });

    it("should respect limit parameter", async () => {
      mockGetAllArticles.mockReturnValue(mockArticles.slice(0, 1));

      const request = new NextRequest(
        "http://localhost:3000/api/articles?limit=1"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filters.limit).toBe(1);
      expect(mockGetAllArticles).toHaveBeenCalledWith(1);
    });

    it("should handle multiple filters correctly", async () => {
      const filteredResults = [mockArticles[0]];
      mockGetArticlesByCategory.mockReturnValue(filteredResults);

      const request = new NextRequest(
        "http://localhost:3000/api/articles?category=Politics&limit=5"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filters.category).toBe("Politics");
      expect(data.data.filters.limit).toBe(5);
      expect(mockGetArticlesByCategory).toHaveBeenCalledWith("Politics", 5);
    });

    it("should handle storage errors gracefully", async () => {
      mockGetAllArticles.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const request = new NextRequest("http://localhost:3000/api/articles");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Storage error");
    });

    it("should include correct response metadata", async () => {
      mockGetAllArticles.mockReturnValue(mockArticles);

      const request = new NextRequest("http://localhost:3000/api/articles");
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("timestamp");
      expect(data.message).toContain("Retrieved 2 articles successfully");
    });
  });
});
