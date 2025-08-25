import {
  ProcessedArticle,
  NewsCardProps,
  TrendingCardProps,
} from "../types/scraping";
import {
  convertToNewsCard,
  convertToTrendingCard,
  calculateReadTime,
} from "../utils/scraping-utils";
import { systemConfig } from "../config/scraping-config";
import { logger } from "../utils/logger";

export class FrontendIntegrationService {
  /**
   * Format articles for the main smart news page
   */
  formatForMainPage(articles: ProcessedArticle[]): {
    featured: NewsCardProps | null;
    sideArticles: NewsCardProps[];
    trending: TrendingCardProps[];
  } {
    try {
      // Filter for politics articles (main focus)
      const politicsArticles = articles
        .filter((article) => article.category === "Politics")
        .sort(
          (a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
        );

      // Get featured article (most recent politics article)
      const featured =
        politicsArticles.length > 0
          ? this.convertToFeaturedCard(politicsArticles[0])
          : null;

      // Get side articles (next 3 politics articles)
      const sideArticles = politicsArticles
        .slice(1, 4)
        .map((article) => convertToNewsCard(article));

      // Get trending articles (mix of all categories, most recent)
      const allArticlesSorted = articles
        .sort(
          (a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
        )
        .slice(0, 6);

      const trending = allArticlesSorted.map((article) =>
        convertToTrendingCard(article)
      );

      logger.info("Articles formatted for main page", {
        featured: featured ? 1 : 0,
        sideArticles: sideArticles.length,
        trending: trending.length,
        totalArticles: articles.length,
      });

      return {
        featured,
        sideArticles,
        trending,
      };
    } catch (error) {
      logger.error("Failed to format articles for main page", error);
      return {
        featured: null,
        sideArticles: [],
        trending: [],
      };
    }
  }

  /**
   * Convert article to featured card format (large size)
   */
  private convertToFeaturedCard(article: ProcessedArticle): NewsCardProps {
    return {
      id: article.id,
      image: this.getArticleImage(article),
      title: article.title,
      excerpt: article.summary || this.extractExcerpt(article.content, 200),
      author: article.author,
      date: this.formatDate(article.publishDate),
      tag: article.category,
      readTime: calculateReadTime(article.metadata.wordCount),
      size: "large",
    };
  }

  /**
   * Get the best available image for an article
   */
  private getArticleImage(article: ProcessedArticle): string {
    // Use first available image from the article
    if (article.imageUrls && article.imageUrls.length > 0) {
      return article.imageUrls[0];
    }

    // Fallback to category-specific default image
    return this.getFallbackImage(article.category);
  }

  /**
   * Get fallback image based on category
   */
  private getFallbackImage(category: string): string {
    const fallbackImages = {
      Politics:
        "https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?auto=compress&cs=tinysrgb&w=800",
      Sports:
        "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800",
      Business:
        "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
      Entertainment:
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800",
      General:
        "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",
    };

    return (
      fallbackImages[category as keyof typeof fallbackImages] ||
      fallbackImages.General
    );
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  /**
   * Extract excerpt from content
   */
  private extractExcerpt(content: string, maxLength: number = 150): string {
    if (!content) return "";

    // Remove HTML tags and clean up
    const cleanContent = content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    // Find the last complete sentence within the limit
    const truncated = cleanContent.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf(".");
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSentence > maxLength * 0.7) {
      return truncated.substring(0, lastSentence + 1);
    } else if (lastSpace > 0) {
      return truncated.substring(0, lastSpace) + "...";
    } else {
      return truncated + "...";
    }
  }

  /**
   * Get formatted data specifically for the main page layout
   */
  async getMainPageData(): Promise<{
    featured: NewsCardProps | null;
    sideArticles: NewsCardProps[];
    trending: TrendingCardProps[];
    stats: {
      totalArticles: number;
      lastUpdated: string;
      categories: Record<string, number>;
    };
  }> {
    try {
      // This would typically fetch from the article storage service
      // For now, return empty structure that can be populated
      const { articleStorage } = await import("./article-storage");

      // Get all articles
      const allArticles = articleStorage.getAllArticles();

      // Format for main page
      const formattedData = this.formatForMainPage(allArticles);

      // Get storage stats
      const storageStats = articleStorage.getStorageStats();

      return {
        ...formattedData,
        stats: {
          totalArticles: storageStats.totalArticles,
          lastUpdated:
            storageStats.newestArticle?.toISOString() ||
            new Date().toISOString(),
          categories: storageStats.categoryCounts,
        },
      };
    } catch (error) {
      logger.error("Failed to get main page data", error);

      // Return empty structure on error
      return {
        featured: null,
        sideArticles: [],
        trending: [],
        stats: {
          totalArticles: 0,
          lastUpdated: new Date().toISOString(),
          categories: {},
        },
      };
    }
  }

  /**
   * Check if we have fresh content (articles from last 24 hours)
   */
  hasFreshContent(articles: ProcessedArticle[]): boolean {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return articles.some(
      (article) =>
        new Date(article.metadata.scrapingTimestamp) > twentyFourHoursAgo
    );
  }

  /**
   * Get content freshness indicator
   */
  getContentFreshness(articles: ProcessedArticle[]): {
    isFresh: boolean;
    lastUpdate: string;
    articlesCount: number;
  } {
    const isFresh = this.hasFreshContent(articles);
    const sortedArticles = articles.sort(
      (a, b) =>
        new Date(b.metadata.scrapingTimestamp).getTime() -
        new Date(a.metadata.scrapingTimestamp).getTime()
    );

    const lastUpdate =
      sortedArticles.length > 0
        ? this.formatDate(
            sortedArticles[0].metadata.scrapingTimestamp.toISOString()
          )
        : "No updates";

    return {
      isFresh,
      lastUpdate,
      articlesCount: articles.length,
    };
  }

  /**
   * Generate fallback content when no articles are available
   */
  generateFallbackContent(): {
    featured: NewsCardProps;
    sideArticles: NewsCardProps[];
    trending: TrendingCardProps[];
  } {
    const fallbackFeatured: NewsCardProps = {
      image: this.getFallbackImage("Politics"),
      title: "Stay Informed with Smart News",
      excerpt:
        "Your AI-powered news platform is ready to deliver the latest political updates from Ghana. Check back soon for fresh content.",
      author: "Smart News Team",
      date: this.formatDate(new Date().toISOString()),
      tag: "System",
      readTime: "1 min read",
      size: "large",
    };

    const fallbackSide: NewsCardProps[] = [
      {
        id: "fallback-1",
        image: this.getFallbackImage("Politics"),
        title: "AI-Powered News Aggregation",
        excerpt:
          "Our system automatically discovers and processes news from trusted Ghanaian sources.",
        author: "Smart News",
        date: this.formatDate(new Date().toISOString()),
        tag: "Technology",
        readTime: "2 min read",
      },
      {
        id: "fallback-2",
        image: this.getFallbackImage("General"),
        title: "Fresh Content Daily",
        excerpt:
          "New articles are processed every day at 6 AM to keep you updated with the latest news.",
        author: "Smart News",
        date: this.formatDate(new Date().toISOString()),
        tag: "Updates",
        readTime: "1 min read",
      },
    ];

    const fallbackTrending: TrendingCardProps[] = [
      {
        id: "trending-1",
        image: this.getFallbackImage("Politics"),
        title: "Political News Coming Soon",
        author: "Smart News",
        date: this.formatDate(new Date().toISOString()),
        tag: "Politics",
        readTime: "3 min read",
      },
      {
        id: "trending-2",
        image: this.getFallbackImage("Business"),
        title: "Business Updates Available",
        author: "Smart News",
        date: this.formatDate(new Date().toISOString()),
        tag: "Business",
        readTime: "2 min read",
      },
      {
        id: "trending-3",
        image: this.getFallbackImage("Sports"),
        title: "Sports Coverage Ready",
        author: "Smart News",
        date: this.formatDate(new Date().toISOString()),
        tag: "Sports",
        readTime: "4 min read",
      },
    ];

    return {
      featured: fallbackFeatured,
      sideArticles: fallbackSide,
      trending: fallbackTrending,
    };
  }
}

// Export singleton instance
export const frontendIntegration = new FrontendIntegrationService();
