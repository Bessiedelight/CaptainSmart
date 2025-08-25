/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { cronScheduler } from "@/lib/services/cron-scheduler";
import { logger } from "@/lib/utils/logger";

// Simple API key validation
const API_KEY = process.env.SCRAPING_API_KEY || "dev-api-key";

interface CronResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * GET /api/cron/status
 * Get current cron scheduler status
 */
export async function GET(request: NextRequest) {
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
        } as CronResponse,
        { status: 401 }
      );
    }

    const status = cronScheduler.getStatus();
    const timeUntilNext = cronScheduler.getFormattedTimeUntilNextRun();

    logger.info("Cron status requested via API");

    return NextResponse.json(
      {
        success: true,
        message: "Cron scheduler status retrieved successfully",
        data: {
          ...status,
          timeUntilNextRun: timeUntilNext,
          serverTime: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      } as CronResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Cron status API error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve cron status",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as CronResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/status
 * Control cron scheduler (start/stop/test)
 */
export async function POST(request: NextRequest) {
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
        } as CronResponse,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !["start", "stop", "test"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action",
          error: "Action must be one of: start, stop, test",
          timestamp: new Date().toISOString(),
        } as CronResponse,
        { status: 400 }
      );
    }

    logger.info(`Cron scheduler ${action} requested via API`);

    let result: { message: string; testResult?: unknown } = { message: "" };

    switch (action) {
      case "start":
        cronScheduler.start();
        result = { message: "Cron scheduler started successfully" };
        break;

      case "stop":
        cronScheduler.stop();
        result = { message: "Cron scheduler stopped successfully" };
        break;

      case "test":
        try {
          const testResult = await cronScheduler.triggerTestRun();
          result = {
            message: "Test run completed successfully",
            testResult,
          };
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              message: "Test run failed",
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            } as CronResponse,
            { status: 500 }
          );
        }
        break;

      default:
        // This should never happen due to validation above, but TypeScript safety
        result = { message: "Unknown action" };
        break;
    }

    const status = cronScheduler.getStatus();

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: {
          action,
          status,
          timeUntilNextRun: cronScheduler.getFormattedTimeUntilNextRun(),
          testResult: result.testResult || null,
        },
        timestamp: new Date().toISOString(),
      } as CronResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Cron control API error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to control cron scheduler",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as CronResponse,
      { status: 500 }
    );
  }
}
