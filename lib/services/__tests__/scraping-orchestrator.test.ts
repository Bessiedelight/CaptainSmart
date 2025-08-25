import { ScrapingOrchestrator } from "../scraping-orchestrator";
import { ErrorType } from "../../types/scraping";

// Mock all the services
const mockWebsiteDiscovery = {
  initBrowser: jest.fn(),
  closeBrowser: jest.fn(),
  discoverAllArticleUrls: jest.fn(),
  testWebsiteDiscovery: jest.fn(),
  clearDiscoveredUrls: jest.fn(),
  getDiscoveryStats: jest
    .fn()
    .mockReturnValue({ totalDiscovered: 10, uniqueUrls: 10 }),
};

const mockArticleExtraction = {
  setBrowser: jest.fn(),
  extractMultipleArticles: jest.fn(),
  getExtractionStats: jest
    .fn()
    .mockReturnValue({
      successRate: 0.9,
      averageWordCount: 400,
      totalExtracted: 8,
    }),
};

const mockAIProcessing = {
  processBatch: jest.fn(),
  getProcessingStats: jest
    .fn()
    .mockReturnValue({
      totalProcessed: 7,
      successRate: 0.85,
      averageConfidenceScore: 0.8,
    }),
};

const mockArticleStorage = {
  storeArticles: jest.fn(),
  cleanupOldArticles: jest.fn().mockReturnValue(2),
  removeDuplicates: jest.fn().mockReturnValue(1),
  getStorageStats: jest.fn().mockReturnValue({
    totalArticles: 7,
    categoryCounts: { Politics: 5, Sports: 2 },
    oldestArticle: new Date(),
    newestArticle: new Date(),
  }),
};

// Mock the service modules
jest.mock("../website-discovery", () => ({
  websiteDiscovery: mockWebsiteDiscovery,
}));

jest.mock("../article-extraction", () => ({
  articleExtraction: mockArticleExtraction,
}));

jest.mock("../ai-processing", () => ({
  aiProcessing: mockAIProcessing,
}));

jest.mock("../article-storage", () => ({
  articleStorage: mockArticleStorage,
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
  sleep: jest.fn().mockResolvedValue(undefined),
}));

// Mock scraping config
jest.mock("../../config/scraping-config", () => ({
  scrapingConfig: {
    maxArticlesPerRun: 20,
    targetWebsites: [{ name: "TestSite1" }, { name: "TestSite2" }],
  },
}));

describe("ScrapingOrchestrator", () => {
  let orchestrator: ScrapingOrchestrator;
  let mockUrls: string[];
  let mockRawArticles: any[];
  let mockProcessedArticles: any[];

  beforeEach(() => {
    orchestrator = new ScrapingOrchestrator();

    mockUrls = [
      "https://example.com/article1",
      "https://example.com/article2",
      "https://example.com/article3",
    ];

    mockRawArticles = [
      {
        url: "https://example.com/article1",
        title: "Test Article 1",
        content: "Content 1",
        author: "Author 1",
        publishDate: "2025-01-26",
        category: "Politics",
        imageUrls: ["https://example.com/image1.jpg"],
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article1",
          wordCount: 100,
          estimatedReadTime: 1,
        },
      },
      {
        url: "https://example.com/article2",
        title: "Test Article 2",
        content: "Content 2",
        author: "Author 2",
        publishDate: "2025-01-26",
        category: "Sports",
        imageUrls: ["https://example.com/image2.jpg"],
        metadata: {
          scrapingTimestamp: new Date(),
          sourceUrl: "https://example.com/article2",
          wordCount: 150,
          estimatedReadTime: 1,
        },
      },
    ];

    mockProcessedArticles = [
      {
        id: "processed-1",
        title: "Processed Article 1",
        content: "Processed content 1",
        summary: "Summary 1",
        author: "Author 1",
        publishDate: "2025-01-26",
        category: "Politics",
        tags: ["politics", "news"],
        imageUrls: ["https://example.com/image1.jpg"],
        metadata: mockRawArticles[0].metadata,
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "gemini-2.0-flash-exp",
          confidenceScore: 0.9,
          originalWordCount: 100,
          processedWordCount: 120,
        },
      },
    ];

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("executeDailyPipeline", () => {
    beforeEach(() => {
      mockWebsiteDiscovery.discoverAllArticleUrls.mockResolvedValue(mockUrls);
      mockArticleExtraction.extractMultipleArticles.mockResolvedValue(
        mockRawArticles
      );
      mockAIProcessing.processBatch.mockResolvedValue(mockProcessedArticles);
    });

    it("should execute the complete pipeline successfully", async () => {
      const result = await orchestrator.executeDailyPipeline();

      expect(mockWebsiteDiscovery.initBrowser).toHaveBeenCalled();
      expect(mockWebsiteDiscovery.discoverAllArticleUrls).toHaveBeenCalled();
      expect(mockArticleExtraction.setBrowser).toHaveBeenCalled();
      expect(
        mockArticleExtraction.extractMultipleArticles
      ).toHaveBeenCalledWith(mockUrls);
      expect(mockAIProcessing.processBatch).toHaveBeenCalledWith(
        mockRawArticles
      );
      expect(mockArticleStorage.storeArticles).toHaveBeenCalledWith(
        mockProcessedArticles
      );
      expect(mockWebsiteDiscovery.closeBrowser).toHaveBeenCalled();

      expect(result.totalArticlesProcessed).toBe(1);
      expect(result.successfulArticles).toBe(1);
      expect(result.failedArticles).toBe(1); // 2 raw articles - 1 processed = 1 failed
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it("should handle no URLs discovered", async () => {
      mockWebsiteDiscovery.discoverAllArticleUrls.mockResolvedValue([]);

      const result = await orchestrator.executeDailyPipeline();

      expect(
        mockArticleExtraction.extractMultipleArticles
      ).not.toHaveBeenCalled();
      expect(mockAIProcessing.processBatch).not.toHaveBeenCalled();
      expect(result.totalArticlesProcessed).toBe(0);
    });

    it("should handle no articles extracted", async () => {
      mockArticleExtraction.extractMultipleArticles.mockResolvedValue([]);

      const result = await orchestrator.executeDailyPipeline();

      expect(mockAIProcessing.processBatch).not.toHaveBeenCalled();
      expect(result.totalArticlesProcessed).toBe(0);
    });

    it("should handle pipeline errors gracefully", async () => {
      mockWebsiteDiscovery.discoverAllArticleUrls.mockRejectedValue(
        new Error("Discovery failed")
      );

      const result = await orchestrator.executeDailyPipeline();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.errors[0].message).toBe("Pipeline execution failed");
    });

    it("should perform cleanup operations", async () => {
      await orchestrator.executeDailyPipeline();

      expect(mockArticleStorage.cleanupOldArticles).toHaveBeenCalled();
      expect(mockArticleStorage.removeDuplicates).toHaveBeenCalled();
      expect(mockWebsiteDiscovery.clearDiscoveredUrls).toHaveBeenCalled();
    });

    it("should prevent concurrent pipeline execution", async () => {
      const promise1 = orchestrator.executeDailyPipeline();

      await expect(orchestrator.executeDailyPipeline()).rejects.toThrow(
        "Scraping pipeline is already running"
      );

      await promise1; // Wait for first execution to complete
    });
  });

  describe("processTargetWebsites", () => {
    beforeEach(() => {
      mockWebsiteDiscovery.testWebsiteDiscovery.mockResolvedValue(mockUrls);
      mockArticleExtraction.extractMultipleArticles.mockResolvedValue(
        mockRawArticles
      );
      mockAIProcessing.processBatch.mockResolvedValue(mockProcessedArticles);
    });

    it("should process specific websites", async () => {
      const websiteNames = ["TestSite1", "TestSite2"];

      const result = await orchestrator.processTargetWebsites(websiteNames);

      expect(mockWebsiteDiscovery.testWebsiteDiscovery).toHaveBeenCalledTimes(
        2
      );
      expect(mockWebsiteDiscovery.testWebsiteDiscovery).toHaveBeenCalledWith(
        "TestSite1"
      );
      expect(mockWebsiteDiscovery.testWebsiteDiscovery).toHaveBeenCalledWith(
        "TestSite2"
      );
      expect(result).toHaveLength(2); // One processed article per website
    });

    it("should handle individual website failures", async () => {
      mockWebsiteDiscovery.testWebsiteDiscovery
        .mockResolvedValueOnce(mockUrls) // First website succeeds
        .mockRejectedValueOnce(new Error("Website failed")); // Second website fails

      const websiteNames = ["TestSite1", "TestSite2"];
      const result = await orchestrator.processTargetWebsites(websiteNames);

      expect(result).toHaveLength(1); // Only one successful website
    });
  });

  describe("getPipelineStatus", () => {
    it("should return current pipeline status", () => {
      const status = orchestrator.getPipelineStatus();

      expect(status).toHaveProperty("isRunning");
      expect(status).toHaveProperty("currentMetrics");
      expect(status).toHaveProperty("storageStats");
      expect(typeof status.isRunning).toBe("boolean");
    });
  });

  describe("getPipelineMetrics", () => {
    it("should return comprehensive pipeline metrics", () => {
      const metrics = orchestrator.getPipelineMetrics();

      expect(metrics).toHaveProperty("discoveryStats");
      expect(metrics).toHaveProperty("extractionStats");
      expect(metrics).toHaveProperty("processingStats");
      expect(metrics).toHaveProperty("storageStats");

      expect(mockWebsiteDiscovery.getDiscoveryStats).toHaveBeenCalled();
      expect(mockArticleExtraction.getExtractionStats).toHaveBeenCalled();
      expect(mockAIProcessing.getProcessingStats).toHaveBeenCalled();
      expect(mockArticleStorage.getStorageStats).toHaveBeenCalled();
    });
  });

  describe("testPipeline", () => {
    beforeEach(() => {
      mockWebsiteDiscovery.discoverAllArticleUrls.mockResolvedValue(
        mockUrls.slice(0, 2)
      ); // Limited URLs
      mockArticleExtraction.extractMultipleArticles.mockResolvedValue(
        mockRawArticles.slice(0, 1)
      );
      mockAIProcessing.processBatch.mockResolvedValue(
        mockProcessedArticles.slice(0, 1)
      );
    });

    it("should run pipeline test with limited scope", async () => {
      const result = await orchestrator.testPipeline();

      expect(result.totalArticlesProcessed).toBeLessThanOrEqual(5);
      expect(mockWebsiteDiscovery.initBrowser).toHaveBeenCalled();
      expect(mockWebsiteDiscovery.closeBrowser).toHaveBeenCalled();
    });
  });

  describe("emergencyStop", () => {
    it("should stop running pipeline", async () => {
      // Start pipeline in background
      const pipelinePromise = orchestrator.executeDailyPipeline();

      // Emergency stop
      await orchestrator.emergencyStop();

      // Wait for pipeline to complete
      await pipelinePromise;

      const status = orchestrator.getPipelineStatus();
      expect(status.isRunning).toBe(false);
    });

    it("should handle emergency stop when not running", async () => {
      await expect(orchestrator.emergencyStop()).resolves.not.toThrow();
    });
  });

  describe("handleErrors", () => {
    it("should handle retryable errors", async () => {
      const error = {
        type: ErrorType.NETWORK_ERROR,
        message: "Network timeout",
        timestamp: new Date(),
        retryable: true,
      };

      await expect(orchestrator.handleErrors(error)).resolves.not.toThrow();
    });

    it("should handle non-retryable errors", async () => {
      const error = {
        type: ErrorType.VALIDATION_ERROR,
        message: "Invalid data",
        timestamp: new Date(),
        retryable: false,
      };

      await expect(orchestrator.handleErrors(error)).resolves.not.toThrow();
    });
  });
});
