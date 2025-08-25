/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@/lib/services/monitoring";
import { errorHandler } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";

// Simple API key validation
const API_KEY = process.env.SCRAPING_API_KEY || "dev-api-key";

interface HealthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * GET /api/monitoring/health
 * Get system health status and metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key for monitoring endpoints
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access",
          error: "Invalid API key",
          timestamp: new Date().toISOString(),
        } as HealthResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get("detailed") === "true";

    // Get health status
    const health = monitoring.getHealthStatus();

    logger.info("Health check requested", {
      status: health.status,
      issuesCount: health.issues.length,
      detailed,
    });

    let responseData: any = {
      status: health.status,
      issues: health.issues,
      timestamp: health.metrics.timestamp,
    };

    if (detailed) {
      // Include detailed metrics
      responseData = {
        ...responseData,
        metrics: health.metrics,
        trends: monitoring.getPerformanceTrends(),
        recentErrors: errorHandler.getRecentErrors(5),
      };
    } else {
      // Include summary metrics only
      responseData.summary = {
        totalArticles: health.metrics.articles.totalArticles,
        freshArticles: health.metrics.articles.freshArticles,
        errorRate: health.metrics.errors.errorRate,
        memoryUsage: health.metrics.performance.memoryUsage.percentage,
        uptime: health.metrics.performance.uptime,
      };
    }

    const statusCode = health.status === "critical" ? 503 : 200;

    return NextResponse.json(
      {
        success: true,
        message: `System health: ${health.status}`,
        data: responseData,
        timestamp: new Date().toISOString(),
      } as HealthResponse,
      { status: statusCode }
    );
  } catch (error) {
    logger.error("Health check endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve health status",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as HealthResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/health
 * Trigger manual health check and metrics collection
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
        } as HealthResponse,
        { status: 401 }
      );
    }

    logger.info("Manual health check triggered");

    // Force metrics collection
    const metrics = monitoring.collectMetrics();
    const health = monitoring.getHealthStatus();
    const alerts = monitoring.checkAlerts();

    // Log any alerts
    if (alerts.length > 0) {
      logger.warn("Health check alerts detected", { alerts });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Manual health check completed",
        data: {
          status: health.status,
          issues: health.issues,
          alerts,
          metrics,
          collectedAt: metrics.timestamp,
        },
        timestamp: new Date().toISOString(),
      } as HealthResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Manual health check error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform manual health check",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as HealthResponse,
      { status: 500 }
    );
  }
}
