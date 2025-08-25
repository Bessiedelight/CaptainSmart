import { NextRequest, NextResponse } from "next/server";
import { articleStorage } from "@/lib/services/article-storage";
import { logger } from "@/lib/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Article ID is required",
        },
        { status: 400 }
      );
    }

    logger.info(`Fetching article with ID: ${id}`);

    // Get the specific article from storage
    const article = articleStorage.getArticleById(id);

    if (!article) {
      logger.warn(`Article not found: ${id}`);
      return NextResponse.json(
        {
          success: false,
          error: "Article not found",
        },
        { status: 404 }
      );
    }

    logger.info(`Successfully retrieved article: ${article.title}`);

    return NextResponse.json({
      success: true,
      message: "Article retrieved successfully",
      data: article,
    });
  } catch (error) {
    logger.error("Failed to fetch article:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
