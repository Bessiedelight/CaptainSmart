import { NextRequest, NextResponse } from "next/server";
import { errorHandler } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";

// Simple API key validation
const API_KEY = process.env.SCRAPING_API_KEY || "dev-api-key";

interface ErrorResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * GET /api/monitoring/errors
 * Get error statistics and recent errors
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
        } as ErrorResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;

    // Get error statistics
    const errorStats = errorHandler.getErrorStats();
    const recentErrors = errorHandler.getRecentErrors(limit);
    const isErrorRateHigh = errorHandler.isErrorRateHigh();

    logger.info("Error monitoring data requested", {
      totalErrors: errorStats.totalErrors,
      recentErrorsCount: recentErrors.length,
      errorRateHigh: isErrorRateHigh,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Retrieved error monitoring data`,
        data: {
          statistics: errorStats,
          recentErrors: recentErrors.map((error) => ({
            type: error.type,
            message: error.message,
            url: error.url,
            timestamp: error.timestamp,
            retryable: error.retryable,
            context: error.context,
          })),
          alerts: {
            isErrorRateHigh,
            threshold: 10,
            currentRate: errorStats.errorRate,
          },
        },
        timestamp: new Date().toISOString(),
      } as ErrorResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error monitoring endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve error monitoring data",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitoring/errors
 * Clear error statistics (useful for testing/maintenance)
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
        } as ErrorResponse,
        { status: 401 }
      );
    }

    logger.warn("Error statistics cleared via API");

    // Clear error statistics
    errorHandler.clearStats();

    return NextResponse.json(
      {
        success: true,
        message: "Error statistics cleared successfully",
        timestamp: new Date().toISOString(),
      } as ErrorResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error clearing endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear error statistics",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as ErrorResponse,
      { status: 500 }
    );
  }
}
