import { NextRequest } from "next/server";
import { POST, GET, DELETE } from "../route";
import { describe, beforeEach, it } from "node:test";

// Mock the scraping orchestrator
const mockExecuteDailyPipeline = jest.fn();
const mockTestPipeline = jest.fn();
const mockProcessTargetWebsites = jest.fn();
const mockGetPipelineStatus = jest.fn();
const mockGetPipelineMetrics = jest.fn();
const mockEmergencyStop = jest.fn();

jest.mock("@/lib/services/scraping-orchestrator", () => ({
  scrapingOrchestrator: {
    executeDailyPipeline: mockExecuteDailyPipeline,
    testPipeline: mockTestPipeline,
    processTargetWebsites: mockProcessTargetWebsites,
    getPipelineStatus: mockGetPipelineStatus,
    getPipelineMetrics: mockGetPipelineMetrics,
    emergencyStop: mockEmergencyStop,
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

// Mock environment
jest.mock("@/lib/config/env", () => ({
  env: {
    validate: jest.fn(),
  },
}));

// Mock environment variables
process.env.SCRAPING_API_KEY = "test-api-key";

describe("/api/scraping/trigger", () => {
  const mockScrapingResult = {
    totalArticlesProcessed: 5,
    successfulArticles: 5,
    failedArticles: 0,
    processingTime: 30000,
    errors: [],
  };

  const mockPipelineStatus = {
    isRunning: false,
    currentMetrics: {
      startTime: new Date(),
      urlsDiscovered: 10,
      articlesExtracted: 8,
      articlesProcessed: 5,
      errors: [],
    },
    storageStats: {
      totalArticles: 5,
      categoryCounts: { Politics: 3, Sports: 2 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPipelineStatus.mockReturnValue(mockPipelineStatus);
    mockGetPipelineMetrics.mockReturnValue({
      discoveryStats: { totalDiscovered: 10 },
      extractionStats: { successRate: 0.8 },
      processingStats: { successRate: 0.9 },
      storageStats: { totalArticles: 5 },
    });
  });

  describe("POST", () => {
    it("should trigger full pipeline successfully", async () => {
      mockExecuteDailyPipeline.mockResolvedValue(mockScrapingResult);

      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "content-type": "application/json",
          },
          body: JSON.stringify({ mode: "full" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("completed successfully");
      expect(data.data.result).toEqual(mockScrapingResult);
      expect(mockExecuteDailyPipeline).toHaveBeenCalled();
    });

    it("should trigger test pipeline successfully", async () => {
      mockTestPipeline.mockResolvedValue(mockScrapingResult);

      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "content-type": "application/json",
          },
          body: JSON.stringify({ mode: "test" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockTestPipeline).toHaveBeenCalled();
    });

    it("should trigger website-specific pipeline successfully", async () => {
      const mockProcessedArticles = [
        { id: "1", title: "Article 1" },
        { id: "2", title: "Article 2" },
      ];
      mockProcessTargetWebsites.mockResolvedValue(mockProcessedArticles);

      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            mode: "websites",
            websites: ["GhanaWeb", "MyJoyOnline"],
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockProcessTargetWebsites).toHaveBeenCalledWith([
        "GhanaWeb",
        "MyJoyOnline",
      ]);
    });

    it("should reject unauthorized requests", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "POST",
          headers: {
            "x-api-key": "invalid-key",
            "content-type": "application/json",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid API key");
    });

    it("should reject requests when pipeline is already running", async () => {
      mockGetPipelineStatus.mockReturnValue({
        ...mockPipelineStatus,
        isRunning: true,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "content-type": "application/json",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Another scraping process is currently active");
    });

    it("should handle pipeline execution errors", async () => {
      mockExecuteDailyPipeline.mockRejectedValue(new Error("Pipeline failed"));

      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "POST",
          headers: {
            "x-api-key": "test-api-key",
            "content-type": "application/json",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Pipeline failed");
    });
  });

  describe("GET", () => {
    it("should return pipeline status successfully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "GET",
          headers: {
            "x-api-key": "test-api-key",
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toEqual(mockPipelineStatus);
      expect(mockGetPipelineStatus).toHaveBeenCalled();
      expect(mockGetPipelineMetrics).toHaveBeenCalled();
    });

    it("should reject unauthorized status requests", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "GET",
          headers: {
            "x-api-key": "invalid-key",
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe("DELETE", () => {
    it("should execute emergency stop successfully", async () => {
      mockEmergencyStop.mockResolvedValue(undefined);

      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "DELETE",
          headers: {
            "x-api-key": "test-api-key",
          },
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("emergency stop executed");
      expect(mockEmergencyStop).toHaveBeenCalled();
    });

    it("should reject unauthorized emergency stop requests", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/scraping/trigger",
        {
          method: "DELETE",
          headers: {
            "x-api-key": "invalid-key",
          },
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });
});
