/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { articleStorage } from "@/lib/services/article-storage";
import {
  convertToNewsCard,
  convertToTrendingCard,
} from "@/lib/utils/scraping-utils";
import { logger } from "@/lib/utils/logger";

interface PoliticsResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * GET /api/articles/politics
 * Retrieve political articles formatted for frontend components
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 20;
    const format = searchParams.get("format") || "raw"; // 'raw', 'cards', 'trending'

    // Get political articles
    const articles = articleStorage.getArticlesByCategory("Politics", limit);

    logger.info(`Political articles retrieved`, {
      count: articles.length,
      format,
      limit,
    });

    let formattedData;

    switch (format) {
      case "cards":
        // Format for NewsCard components
        formattedData = {
          featured: articles.length > 0 ? convertToNewsCard(articles[0]) : null,
          articles: articles
            .slice(1)
            .map((article) => convertToNewsCard(article)),
        };
        break;

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

    // Get category statistics
    const stats = articleStorage.getStorageStats();
    const politicsCount = stats.categoryCounts.Politics || 0;

    return NextResponse.json(
      {
        success: true,
        message: `Retrieved ${articles.length} political articles successfully`,
        data: {
          articles: formattedData,
          meta: {
            total: articles.length,
            totalInCategory: politicsCount,
            format,
            limit,
            lastUpdated: stats.newestArticle,
          },
        },
        timestamp: new Date().toISOString(),
      } as PoliticsResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Politics articles API endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve political articles",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as PoliticsResponse,
      { status: 500 }
    );
  }
}
