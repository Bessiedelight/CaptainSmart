import { ProcessedArticle } from "../types/scraping";
import { logger } from "../utils/logger";
import { systemConfig } from "../config/scraping-config";

export class ArticleStorageService {
  private articles: Map<string, ProcessedArticle> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private lastCleanup: Date = new Date();
  private maintenanceStats = {
    totalCleanups: 0,
    articlesRemoved: 0,
    duplicatesRemoved: 0,
    lastMaintenance: new Date(),
    memoryOptimizations: 0,
  };

  constructor() {
    // Initialize category indexes
    this.categoryIndex.set("Politics", new Set());
    this.categoryIndex.set("Sports", new Set());
    this.categoryIndex.set("Business", new Set());
    this.categoryIndex.set("Entertainment", new Set());
    this.categoryIndex.set("General", new Set());
  }

  /**
   * Store a single article in memory
   */
  storeArticle(article: ProcessedArticle): void {
    try {
      this.articles.set(article.id, article);

      // Update category index
      const categorySet = this.categoryIndex.get(article.category);
      if (categorySet) {
        categorySet.add(article.id);
      } else {
        // Create new category if it doesn't exist
        this.categoryIndex.set(article.category, new Set([article.id]));
      }

      logger.info(`Stored article: ${article.title}`, {
        id: article.id,
        category: article.category,
      });
    } catch (error) {
      logger.error(`Failed to store article: ${article.id}`, error);
    }
  }

  /**
   * Store multiple articles in memory
   */
  storeArticles(articles: ProcessedArticle[]): void {
    articles.forEach((article) => this.storeArticle(article));
    logger.info(`Stored ${articles.length} articles in memory`);
  }

  /**
   * Get article by ID
   */
  getArticleById(id: string): ProcessedArticle | null {
    return this.articles.get(id) || null;
  }

  /**
   * Get articles by category with optional limit
   */
  getArticlesByCategory(category: string, limit?: number): ProcessedArticle[] {
    const categorySet = this.categoryIndex.get(category);
    if (!categorySet) {
      return [];
    }

    const articleIds = Array.from(categorySet);
    const articles = articleIds
      .map((id) => this.articles.get(id))
      .filter((article): article is ProcessedArticle => article !== undefined)
      .sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );

    return limit ? articles.slice(0, limit) : articles;
  }

  /**
   * Get all articles sorted by publish date
   */
  getAllArticles(limit?: number): ProcessedArticle[] {
    const articles = Array.from(this.articles.values()).sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );

    return limit ? articles.slice(0, limit) : articles;
  }

  /**
   * Get trending articles (most recent across all categories)
   */
  getTrendingArticles(limit: number = 6): ProcessedArticle[] {
    return this.getAllArticles(limit);
  }

  /**
   * Search articles by title or content
   */
  searchArticles(query: string, limit?: number): ProcessedArticle[] {
    const searchTerm = query.toLowerCase();
    const articles = Array.from(this.articles.values())
      .filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm) ||
          article.content.toLowerCase().includes(searchTerm) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
      )
      .sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );

    return limit ? articles.slice(0, limit) : articles;
  }

  /**
   * Filter articles by tags
   */
  getArticlesByTag(tag: string, limit?: number): ProcessedArticle[] {
    const articles = Array.from(this.articles.values())
      .filter((article) => article.tags.includes(tag))
      .sort(
        (a, b) =>
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      );

    return limit ? articles.slice(0, limit) : articles;
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    totalArticles: number;
    categoryCounts: Record<string, number>;
    oldestArticle: Date | null;
    newestArticle: Date | null;
  } {
    const articles = Array.from(this.articles.values());
    const categoryCounts: Record<string, number> = {};

    // Count articles by category
    this.categoryIndex.forEach((articleIds, category) => {
      categoryCounts[category] = articleIds.size;
    });

    // Find oldest and newest articles
    const dates = articles.map((a) => new Date(a.publishDate));
    const oldestArticle =
      dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : null;
    const newestArticle =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : null;

    return {
      totalArticles: articles.length,
      categoryCounts,
      oldestArticle,
      newestArticle,
    };
  }

  /**
   * Remove articles older than retention period
   */
  cleanupOldArticles(): number {
    const retentionMs = systemConfig.storage.retentionHours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - retentionMs);
    let removedCount = 0;

    for (const [id, article] of this.articles.entries()) {
      const articleDate = new Date(article.metadata.scrapingTimestamp);
      if (articleDate < cutoffTime) {
        this.removeArticle(id);
        removedCount++;
      }
    }

    this.lastCleanup = new Date();
    this.maintenanceStats.totalCleanups++;
    this.maintenanceStats.articlesRemoved += removedCount;
    this.maintenanceStats.lastMaintenance = new Date();

    logger.info(`Cleaned up ${removedCount} old articles`);
    return removedCount;
  }

  /**
   * Remove duplicate articles based on title similarity
   */
  removeDuplicates(): number {
    const articles = Array.from(this.articles.values());
    const duplicateIds: string[] = [];

    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const similarity = this.calculateTitleSimilarity(
          articles[i].title,
          articles[j].title
        );
        if (similarity > 0.8) {
          // 80% similarity threshold
          // Keep the newer article
          const olderArticle =
            new Date(articles[i].publishDate) <
            new Date(articles[j].publishDate)
              ? articles[i]
              : articles[j];
          duplicateIds.push(olderArticle.id);
        }
      }
    }

    // Remove duplicates
    duplicateIds.forEach((id) => this.removeArticle(id));
    this.maintenanceStats.duplicatesRemoved += duplicateIds.length;
    this.maintenanceStats.lastMaintenance = new Date();

    logger.info(`Removed ${duplicateIds.length} duplicate articles`);
    return duplicateIds.length;
  }

  /**
   * Calculate title similarity (simple implementation)
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = title1.toLowerCase().split(/\s+/);
    const words2 = title2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter((word) => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Remove a single article
   */
  private removeArticle(id: string): void {
    const article = this.articles.get(id);
    if (article) {
      // Remove from main storage
      this.articles.delete(id);

      // Remove from category index
      const categorySet = this.categoryIndex.get(article.category);
      if (categorySet) {
        categorySet.delete(id);
      }
    }
  }

  /**
   * Clear all articles from memory
   */
  clearAll(): void {
    this.articles.clear();
    this.categoryIndex.forEach((set) => set.clear());
    logger.info("Cleared all articles from memory");
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): {
    articleCount: number;
    estimatedSizeKB: number;
  } {
    const articleCount = this.articles.size;
    // Rough estimation: each article ~2KB in memory
    const estimatedSizeKB = articleCount * 2;

    return {
      articleCount,
      estimatedSizeKB,
    };
  }

  /**
   * Perform comprehensive maintenance operations
   */
  performMaintenance(): {
    oldArticlesRemoved: number;
    duplicatesRemoved: number;
    memoryOptimized: boolean;
    indexesRebuilt: boolean;
  } {
    logger.info("Starting comprehensive maintenance operations");

    const startTime = Date.now();

    // Clean up old articles
    const oldArticlesRemoved = this.cleanupOldArticles();

    // Remove duplicates
    const duplicatesRemoved = this.removeDuplicates();

    // Optimize memory usage
    const memoryOptimized = this.optimizeMemoryUsage();

    // Rebuild indexes if needed
    const indexesRebuilt = this.rebuildIndexes();

    // Update maintenance stats
    this.maintenanceStats.lastMaintenance = new Date();
    if (memoryOptimized) {
      this.maintenanceStats.memoryOptimizations++;
    }

    const duration = Date.now() - startTime;
    logger.info("Maintenance operations completed", {
      duration,
      oldArticlesRemoved,
      duplicatesRemoved,
      memoryOptimized,
      indexesRebuilt,
    });

    return {
      oldArticlesRemoved,
      duplicatesRemoved,
      memoryOptimized,
      indexesRebuilt,
    };
  }

  /**
   * Optimize memory usage by cleaning up unused references
   */
  private optimizeMemoryUsage(): boolean {
    let optimized = false;

    // Clean up empty category sets
    for (const [category, articleIds] of this.categoryIndex.entries()) {
      if (
        articleIds.size === 0 &&
        ![
          "Politics",
          "Sports",
          "Business",
          "Entertainment",
          "General",
        ].includes(category)
      ) {
        this.categoryIndex.delete(category);
        optimized = true;
      }
    }

    // Force garbage collection hint (if available)
    if (global.gc) {
      global.gc();
      optimized = true;
    }

    return optimized;
  }

  /**
   * Rebuild category indexes to ensure consistency
   */
  private rebuildIndexes(): boolean {
    logger.info("Rebuilding category indexes");

    // Clear existing indexes
    this.categoryIndex.clear();

    // Initialize default categories
    this.categoryIndex.set("Politics", new Set());
    this.categoryIndex.set("Sports", new Set());
    this.categoryIndex.set("Business", new Set());
    this.categoryIndex.set("Entertainment", new Set());
    this.categoryIndex.set("General", new Set());

    // Rebuild indexes from current articles
    for (const [id, article] of this.articles.entries()) {
      let categorySet = this.categoryIndex.get(article.category);
      if (!categorySet) {
        categorySet = new Set();
        this.categoryIndex.set(article.category, categorySet);
      }
      categorySet.add(id);
    }

    logger.info("Category indexes rebuilt successfully");
    return true;
  }

  /**
   * Refresh stale content by updating article metadata
   */
  refreshStaleContent(): number {
    const staleThreshold = 12 * 60 * 60 * 1000; // 12 hours
    const cutoffTime = new Date(Date.now() - staleThreshold);
    let refreshedCount = 0;

    for (const [id, article] of this.articles.entries()) {
      const scrapingTime = new Date(article.metadata.scrapingTimestamp);
      if (scrapingTime < cutoffTime) {
        // Mark as needing refresh (in a real system, this would trigger re-scraping)
        article.metadata.scrapingTimestamp = new Date();
        refreshedCount++;
      }
    }

    logger.info(`Marked ${refreshedCount} articles for content refresh`);
    return refreshedCount;
  }

  /**
   * Get maintenance statistics
   */
  getMaintenanceStats(): {
    totalCleanups: number;
    articlesRemoved: number;
    duplicatesRemoved: number;
    lastMaintenance: Date;
    memoryOptimizations: number;
    nextScheduledMaintenance: Date;
  } {
    // Calculate next scheduled maintenance (every 6 hours)
    const nextScheduledMaintenance = new Date(
      this.maintenanceStats.lastMaintenance.getTime() + 6 * 60 * 60 * 1000
    );

    return {
      ...this.maintenanceStats,
      nextScheduledMaintenance,
    };
  }

  /**
   * Check if maintenance is needed
   */
  isMaintenanceNeeded(): {
    needed: boolean;
    reasons: string[];
    priority: "low" | "medium" | "high";
  } {
    const reasons: string[] = [];
    let priority: "low" | "medium" | "high" = "low";

    // Check if it's been too long since last maintenance
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    if (this.maintenanceStats.lastMaintenance < sixHoursAgo) {
      reasons.push("Scheduled maintenance overdue");
      priority = "medium";
    }

    // Check memory usage
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage.estimatedSizeKB > 10000) {
      // 10MB
      reasons.push("High memory usage detected");
      priority = "high";
    }

    // Check article count
    const stats = this.getStorageStats();
    if (stats.totalArticles > systemConfig.storage.maxArticlesPerCategory * 5) {
      reasons.push("Article count exceeds recommended limits");
      priority = "high";
    }

    // Check for old articles
    const retentionMs = systemConfig.storage.retentionHours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - retentionMs);
    const oldArticlesCount = Array.from(this.articles.values()).filter(
      (article) => new Date(article.metadata.scrapingTimestamp) < cutoffTime
    ).length;

    if (oldArticlesCount > 0) {
      reasons.push(`${oldArticlesCount} old articles need cleanup`);
      if (priority === "low") priority = "medium";
    }

    return {
      needed: reasons.length > 0,
      reasons,
      priority,
    };
  }

  /**
   * Perform automatic maintenance if needed
   */
  autoMaintenance(): boolean {
    const maintenanceCheck = this.isMaintenanceNeeded();

    if (maintenanceCheck.needed && maintenanceCheck.priority !== "low") {
      logger.info("Auto-maintenance triggered", {
        reasons: maintenanceCheck.reasons,
        priority: maintenanceCheck.priority,
      });

      this.performMaintenance();
      return true;
    }

    return false;
  }

  /**
   * Get detailed storage health report
   */
  getStorageHealthReport(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    recommendations: string[];
    stats: ReturnType<ArticleStorageService["getStorageStats"]>;
    maintenance: ReturnType<ArticleStorageService["getMaintenanceStats"]>;
    memory: ReturnType<ArticleStorageService["getMemoryUsage"]>;
  } {
    const stats = this.getStorageStats();
    const maintenance = this.getMaintenanceStats();
    const memory = this.getMemoryUsage();
    const maintenanceCheck = this.isMaintenanceNeeded();

    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: "healthy" | "warning" | "critical" = "healthy";

    // Check memory usage
    if (memory.estimatedSizeKB > 15000) {
      // 15MB
      issues.push("Very high memory usage");
      recommendations.push("Perform immediate cleanup");
      status = "critical";
    } else if (memory.estimatedSizeKB > 10000) {
      // 10MB
      issues.push("High memory usage");
      recommendations.push("Schedule maintenance soon");
      if (status === "healthy") status = "warning";
    }

    // Check maintenance schedule
    if (maintenanceCheck.needed && maintenanceCheck.priority === "high") {
      issues.push("Critical maintenance overdue");
      recommendations.push("Run maintenance immediately");
      status = "critical";
    } else if (maintenanceCheck.needed) {
      issues.push("Maintenance needed");
      recommendations.push("Schedule maintenance");
      if (status === "healthy") status = "warning";
    }

    // Check article distribution
    const totalArticles = stats.totalArticles;
    if (totalArticles === 0) {
      issues.push("No articles in storage");
      recommendations.push("Check scraping pipeline");
      if (status === "healthy") status = "warning";
    }

    // Check category balance
    const maxCategoryCount = Math.max(...Object.values(stats.categoryCounts));
    const minCategoryCount = Math.min(...Object.values(stats.categoryCounts));
    if (maxCategoryCount > minCategoryCount * 10 && totalArticles > 10) {
      issues.push("Unbalanced category distribution");
      recommendations.push("Review scraping configuration");
      if (status === "healthy") status = "warning";
    }

    return {
      status,
      issues,
      recommendations,
      stats,
      maintenance,
      memory,
    };
  }
}

// Ensure singleton across all contexts
declare global {
  var __articleStorage: ArticleStorageService | undefined;
}

// Export singleton instance
export const articleStorage =
  globalThis.__articleStorage ?? new ArticleStorageService();

if (process.env.NODE_ENV !== "production") {
  globalThis.__articleStorage = articleStorage;
}
