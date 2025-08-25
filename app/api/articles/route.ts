/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { articleStorage } from "@/lib/services/article-storage";
import { logger } from "@/lib/utils/logger";

interface ArticlesResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * GET /api/articles
 * Retrieve articles with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get("category");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    let articles;

    if (search) {
      // Search articles by query
      articles = articleStorage.searchArticles(search, limit);
      logger.info(`Article search performed`, {
        search,
        results: articles.length,
      });
    } else if (tag) {
      // Filter by tag
      articles = articleStorage.getArticlesByTag(tag, limit);
      logger.info(`Articles filtered by tag`, {
        tag,
        results: articles.length,
      });
    } else if (category) {
      // Filter by category
      articles = articleStorage.getArticlesByCategory(category, limit);
      logger.info(`Articles filtered by category`, {
        category,
        results: articles.length,
      });
    } else {
      // Get all articles
      articles = articleStorage.getAllArticles(limit);
      logger.info(`All articles retrieved`, { results: articles.length });

      // Debug: Check if storage has articles
      const debugStats = articleStorage.getStorageStats();
      logger.info(
        `Debug - Storage has ${debugStats.totalArticles} total articles`
      );

      // Debug: Try to get articles without limit
      const allArticlesDebug = articleStorage.getAllArticles();
      logger.info(
        `Debug - getAllArticles() returned ${allArticlesDebug.length} articles`
      );
    }

    // Get storage statistics
    const stats = articleStorage.getStorageStats();

    return NextResponse.json(
      {
        success: true,
        message: `Retrieved ${articles.length} articles successfully`,
        data: {
          articles,
          stats,
          filters: {
            category,
            limit,
            search,
            tag,
          },
        },
        timestamp: new Date().toISOString(),
      } as ArticlesResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error("Articles API endpoint error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve articles",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } as ArticlesResponse,
      { status: 500 }
    );
  }
}
