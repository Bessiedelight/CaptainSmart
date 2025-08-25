import { NextResponse } from "next/server";
import { articleStorage } from "@/lib/services/article-storage";

export async function GET() {
  try {
    const stats = articleStorage.getStorageStats();
    const allArticles = articleStorage.getAllArticles(5); // Get first 5 for preview

    return NextResponse.json({
      success: true,
      data: {
        stats,
        sampleArticles: allArticles.map((article) => ({
          id: article.id,
          title: article.title,
          category: article.category,
          publishDate: article.publishDate,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
