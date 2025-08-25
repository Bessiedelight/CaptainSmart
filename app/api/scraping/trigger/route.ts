import { NextRequest, NextResponse } from "next/server";
import { scrapingOrchestrator } from "@/lib/services/scraping-orchestrator";
import { logger } from "@/lib/utils/logger";
import { env } from "@/lib/config/env";

// Simple API key validation (in production, use proper authentication)
const API_KEY = process.env.SCRAPING_API_KEY || "dev-api-key";

interface TriggerRequest {
  mode?: "full" | "test" | "websites";
  websites?: string[];
  apiKey?: string;
}

interface TriggerResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  timestamp: string;
}

/**
 * POST /api/scraping/trigger
 * Triggers the news scraping pipeline
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    let body: TriggerRequest = {};
    try {
      body = await request.json();
    } catch {
      // Allow empty body for simple triggers
      body = {};
    }

    // Validate API key
    const providedApiKey = body.apiKey || request.headers.get("x-api-key");
    if (providedApiKey !== API_KEY) {
      logger.warn("Unauthorized scraping API access attempt", {
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent"),
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access",
          error: "Invalid API key",
          timestamp: new Date().toISOString(),
        } as TriggerResponse,
        { status: 401 }
      );
    }

    // Validate environment - temporarily disabled for deployment
    // Scraping functionality not needed for now
    try {
      // env.validate();
      if (!env.GEMINI_API_KEY) {
        logger.warn(
          "GEMINI_API_KEY not configured - scraping functionality disabled"
        );
        return NextResponse.json(
          {
            success: false,
            message: "Scraping functionality temporarily disabled",
            error: "GEMINI_API_KEY not configured",
            timestamp: new Date().toISOString(),
          } as TriggerResponse,
          { status: 503 }
        );
      }
    } catch (error) {
      logger.error("Environment validation failed", error);
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error",
          error: "Missing required environment variables",
          timestamp: new Date().toISOString(),
        } as TriggerResponse,
        { status: 500 }
      );
    }

    // Get pipeline status
    const status = scrapingOrchestrator.getPipelineStatus();
    if (status.isRunning) {
      logger.warn("Scraping pipeline trigger rejected - already running");
      return NextResponse.json(
        {
          success: false,
          message: "Pipeline is already running",
          error: "Another scraping process is currently active",
          timestamp: new Date().toISOString(),
        } as TriggerResponse,
        { status: 409 }
      );
    }

    // Determine execution mode
    const mode = body.mode || "full";
    logger.info(`Scraping pipeline triggered via API`, {
      mode,
      websites: body.websites,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent"),
    });

    let result;

    switch (mode) {
      case "test":
        logger.info("Running pipeline in test mode");
        result = await scrapingOrchestrator.testPipeline();
        break;

      case "websites":
        if (
          !body.websites ||
          !Array.isArray(body.websites) ||
          body.websites.length === 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid request",
              error: "websites array is required for websites mode",
              timestamp: new Date().toISOString(),
            } as TriggerResponse,
            { status: 400 }
          );
        }

        logger.info(
          `Running pipeline for specific websites: ${body.websites.join(", ")}`
        );
        const processedArticles =
          await scrapingOrchestrator.processTargetWebsites(body.websites);
        result = {
          totalArticlesProcessed: processedArticles.length,
          successfulArticles: processedArticles.length,
          failedArticles: 0,
          processingTime: Date.now() - startTime,
          errors: [],
        };
        break;

      case "full":
      default:
        logger.info("Running full pipeline");
        result = await scrapingOrchestrator.executeDailyPipeline();
        break;
    }

    // Log completion
    const processingTime = Date.now() - startTime;
    logger.info("Scraping pipeline completed via API", {
      mode,
      processingTime,
      totalArticles: result.totalArticlesProcessed,
      successfulArticles: result.successfulArticles,
      failedArticles: result.failedArticles,
      errorCount: result.errors?.length || 0,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Scraping pipeline completed successfully in ${mode} mode`,
        data: {
          mode,
          result,
          processingTime,
          metrics: scrapingOrchestrator.getPipelineMetrics(),
        },
        timestamp: new Date().toISOString(),
      } as TriggerResponse,
      { status: 200 }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error("Scraping API endpoint error", {
      error: error instanceof Error ? error.message : error,
      processingTime,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during scraping",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as TriggerResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/scraping/trigger
 * Get current pipeline status and metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key for status endpoint too
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access",
          error: "Invalid API key",
          timestamp: new Date().toISOString(),
        } as TriggerResponse,
        { status: 401 }
      );
    }

    // Get current status and metrics
    const status = scrapingOrchestrator.getPipelineStatus();
    const metrics = scrapingOrchestrator.getPipelineMetrics();

    logger.info("Pipeline status requested via API", {
      isRunning: status.isRunning,
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pipeline status retrieved successfully",
        data: {
          status,
          metrics,
          serverTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      } as TriggerResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Status API endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve pipeline status",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as TriggerResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scraping/trigger
 * Emergency stop for the pipeline
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access",
          error: "Invalid API key",
          timestamp: new Date().toISOString(),
        } as TriggerResponse,
        { status: 401 }
      );
    }

    logger.warn("Emergency stop requested via API", {
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent"),
    });

    // Execute emergency stop
    await scrapingOrchestrator.emergencyStop();

    return NextResponse.json(
      {
        success: true,
        message: "Pipeline emergency stop executed successfully",
        timestamp: new Date().toISOString(),
      } as TriggerResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Emergency stop API endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute emergency stop",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as TriggerResponse,
      { status: 500 }
    );
  }
}
