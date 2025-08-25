/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { articleStorage } from "@/lib/services/article-storage";
import { convertToTrendingCard } from "@/lib/utils/scraping-utils";
import { logger } from "@/lib/utils/logger";

interface TrendingResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * GET /api/articles/trending
 * Retrieve trending articles across all categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 6;
    const format = searchParams.get("format") || "trending"; // 'raw', 'trending'

    // Get trending articles (most recent across all categories)
    const articles = articleStorage.getTrendingArticles(limit);

    logger.info(`Trending articles retrieved`, {
      count: articles.length,
      format,
      limit,
    });

    let formattedData;

    switch (format) {
      case "trending":
        // Format for TrendingCard components
        formattedData = articles.map((article) =>
          convertToTrendingCard(article)
        );
        break;

      case "raw":
      default:
        // Return raw article data
        formattedData = articles;
        break;
    }

    // Get storage statistics
    const stats = articleStorage.getStorageStats();

    return NextResponse.json(
      {
        success: true,
        message: `Retrieved ${articles.length} trending articles successfully`,
        data: {
          articles: formattedData,
          meta: {
            total: articles.length,
            totalArticles: stats.totalArticles,
            categoryCounts: stats.categoryCounts,
            format,
            limit,
            lastUpdated: stats.newestArticle,
          },
        },
        timestamp: new Date().toISOString(),
      } as TrendingResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Trending articles API endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve trending articles",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as TrendingResponse,
      { status: 500 }
    );
  }
}
