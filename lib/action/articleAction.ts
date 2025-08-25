"use server";

import { connectToDatabase } from "@/utils/mongodb";
import { Article, IArticle } from "@/databaseModels/articleModel";

export interface GetArticlesParams {
  category?: string;
  limit?: number;
  page?: number;
}

export async function getRecentArticles(params: GetArticlesParams = {}) {
  try {
    await connectToDatabase();

    const { limit = 10, page = 1 } = params;
    const skip = (page - 1) * limit;

    const articles = await Article.find({
      isActive: true,
      status: "published",
    })
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return JSON.parse(JSON.stringify(articles));
  } catch (error) {
    console.error("Error fetching recent articles:", error);
    throw new Error("Failed to fetch recent articles");
  }
}

export async function getArticlesByCategory(params: GetArticlesParams) {
  try {
    await connectToDatabase();

    const { category, limit = 10, page = 1 } = params;

    if (!category) {
      throw new Error("Category is required");
    }

    const skip = (page - 1) * limit;

    const articles = await Article.find({
      category,
      isActive: true,
      status: "published",
    })
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return JSON.parse(JSON.stringify(articles));
  } catch (error) {
    console.error("Error fetching articles by category:", error);
    throw new Error("Failed to fetch articles by category");
  }
}

export async function getRandomArticles(params: GetArticlesParams = {}) {
  try {
    await connectToDatabase();

    const { limit = 10 } = params;

    const articles = await Article.aggregate([
      {
        $match: {
          isActive: true,
          status: "published",
        },
      },
      { $sample: { size: limit } },
      {
        $sort: { publishDate: -1 },
      },
    ]);

    return JSON.parse(JSON.stringify(articles));
  } catch (error) {
    console.error("Error fetching random articles:", error);
    throw new Error("Failed to fetch random articles");
  }
}

export async function getArticleById(articleId: string) {
  try {
    await connectToDatabase();

    const article = await Article.findOne({
      articleId,
      isActive: true,
      status: "published",
    }).lean();

    if (!article) {
      throw new Error("Article not found");
    }

    // Increment views
    await Article.updateOne(
      { articleId },
      {
        $inc: { views: 1 },
        $set: { lastViewed: new Date() },
      }
    );

    return JSON.parse(JSON.stringify(article));
  } catch (error) {
    console.error("Error fetching article by ID:", error);
    throw new Error("Failed to fetch article");
  }
}

export async function searchArticles(query: string, limit: number = 10) {
  try {
    await connectToDatabase();

    const articles = await Article.find({
      $text: { $search: query },
      isActive: true,
      status: "published",
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();

    return JSON.parse(JSON.stringify(articles));
  } catch (error) {
    console.error("Error searching articles:", error);
    throw new Error("Failed to search articles");
  }
}
