/* eslint-disable @typescript-eslint/no-explicit-any */
import { Browser } from "puppeteer";
import { websiteDiscovery } from "./website-discovery";
import { articleExtraction } from "./article-extraction";
import { aiProcessing } from "./ai-processing";
import { articleStorage } from "./article-storage";
import {
  ScrapingResult,
  ScrapingError,
  ErrorType,
  ProcessedArticle,
} from "../types/scraping";
import { logger } from "../utils/logger";
import { scrapingConfig } from "../config/scraping-config";
import { sleep, generateArticleId } from "../utils/scraping-utils";

export class ScrapingOrchestrator {
  private browser: Browser | null = null;
  private isRunning: boolean = false;
  private currentRunMetrics: {
    startTime: Date;
    urlsDiscovered: number;
    articlesExtracted: number;
    articlesProcessed: number;
    errors: ScrapingError[];
  } = {
    startTime: new Date(),
    urlsDiscovered: 0,
    articlesExtracted: 0,
    articlesProcessed: 0,
    errors: [],
  };

  /**
   * Execute the complete scraping and processing pipeline
   */
  async executeDailyPipeline(): Promise<ScrapingResult> {
    if (this.isRunning) {
      throw new Error("Scraping pipeline is already running");
    }

    this.isRunning = true;
    this.resetMetrics();

    logger.info("Starting daily scraping pipeline");

    try {
      // Initialize browser
      await this.initializeBrowser();

      // Step 1: Discover article URLs
      const urls = await this.discoverArticleUrls();
      this.currentRunMetrics.urlsDiscovered = urls.length;

      if (urls.length === 0) {
        logger.warn("No URLs discovered, ending pipeline");
        return this.createResult();
      }

      // Step 2: Extract article data
      const rawArticles = await this.extractArticles(urls);
      this.currentRunMetrics.articlesExtracted = rawArticles.length;

      if (rawArticles.length === 0) {
        logger.warn("No articles extracted, ending pipeline");
        return this.createResult();
      }

      // Step 3: Process articles through AI
      const processedArticles =
        await this.processArticlesThroughAI(rawArticles);
      this.currentRunMetrics.articlesProcessed = processedArticles.length;

      // Step 4: Store processed articles
      await this.storeProcessedArticles(processedArticles);

      // Step 5: Cleanup old articles
      await this.performCleanup();

      logger.info(
        `Pipeline completed successfully. Processed ${processedArticles.length} articles`
      );
      return this.createResult();
    } catch (error) {
      logger.error("Pipeline execution failed", error);
      this.addError(
        ErrorType.NETWORK_ERROR,
        "Pipeline execution failed",
        undefined,
        error
      );
      return this.createResult();
    } finally {
      await this.cleanup();
      this.isRunning = false;
    }
  }

  /**
   * Process specific target websites
   */
  async processTargetWebsites(
    websiteNames: string[]
  ): Promise<ProcessedArticle[]> {
    if (this.isRunning) {
      throw new Error("Scraping pipeline is already running");
    }

    this.isRunning = true;
    this.resetMetrics();

    try {
      await this.initializeBrowser();

      const allProcessedArticles: ProcessedArticle[] = [];

      for (const websiteName of websiteNames) {
        try {
          logger.info(`Processing website: ${websiteName}`);

          // Discover URLs for specific website
          const website = scrapingConfig.targetWebsites.find(
            (w) => w.name === websiteName
          );
          if (!website) {
            throw new Error(`Website configuration not found: ${websiteName}`);
          }

          const urls = await websiteDiscovery.discoverArticleUrls(
            website.baseUrl,
            website.categoryPages,
            website
          );

          // Limit URLs to prevent overwhelming
          const limitedUrls = urls.slice(0, scrapingConfig.maxArticlesPerRun);

          // Extract articles
          const rawArticles =
            await articleExtraction.extractMultipleArticles(limitedUrls);

          // Process through AI (with fallback)
          const processedArticles =
            await this.processArticlesThroughAI(rawArticles);

          // Store articles
          articleStorage.storeArticles(processedArticles);

          allProcessedArticles.push(...processedArticles);

          logger.info(
            `Completed processing ${websiteName}: ${processedArticles.length} articles`
          );

          // Add delay between websites
          await sleep(3000);
        } catch (error) {
          logger.error(`Failed to process website: ${websiteName}`, error);
          this.addError(
            ErrorType.NETWORK_ERROR,
            `Failed to process website: ${websiteName}`,
            undefined,
            error
          );
        }
      }

      return allProcessedArticles;
    } finally {
      await this.cleanup();
      this.isRunning = false;
    }
  }

  /**
   * Initialize browser for scraping
   */
  private async initializeBrowser(): Promise<void> {
    try {
      await websiteDiscovery.initBrowser();
      this.browser = (websiteDiscovery as any).browser;

      if (!this.browser) {
        throw new Error("Failed to initialize browser - browser is null");
      }

      articleExtraction.setBrowser(this.browser);
      logger.info("Browser initialized for scraping pipeline");
    } catch (error) {
      logger.error("Failed to initialize browser", error);
      throw error;
    }
  }

  /**
   * Discover article URLs from all configured websites
   */
  private async discoverArticleUrls(): Promise<string[]> {
    try {
      logger.info("Starting URL discovery phase");
      const urls = await websiteDiscovery.discoverAllArticleUrls();

      // Limit URLs to prevent overwhelming the system
      const limitedUrls = urls.slice(0, scrapingConfig.maxArticlesPerRun);

      logger.info(
        `Discovered ${urls.length} URLs, processing ${limitedUrls.length}`
      );
      return limitedUrls;
    } catch (error) {
      logger.error("URL discovery failed", error);
      this.addError(
        ErrorType.NETWORK_ERROR,
        "URL discovery failed",
        undefined,
        error
      );
      return [];
    }
  }

  /**
   * Extract article data from URLs
   */
  private async extractArticles(
    urls: string[]
  ): Promise<import("../types/scraping").RawArticle[]> {
    try {
      logger.info(`Starting article extraction for ${urls.length} URLs`);
      const articles = await articleExtraction.extractMultipleArticles(urls);

      logger.info(`Successfully extracted ${articles.length} articles`);
      return articles;
    } catch (error) {
      logger.error("Article extraction failed", error);
      this.addError(
        ErrorType.PARSING_ERROR,
        "Article extraction failed",
        undefined,
        error
      );
      return [];
    }
  }

  /**
   * Process articles through AI
   */
  private async processArticlesThroughAI(
    rawArticles: import("../types/scraping").RawArticle[]
  ): Promise<ProcessedArticle[]> {
    try {
      logger.info(`Starting AI processing for ${rawArticles.length} articles`);

      // Try AI processing first
      try {
        const processedArticles = await aiProcessing.processBatch(rawArticles);
        if (processedArticles.length > 0) {
          logger.info(
            `Successfully processed ${processedArticles.length} articles through AI`
          );
          return processedArticles;
        }
      } catch (aiError: any) {
        // Check if it's a quota error
        const isQuotaError =
          aiError?.message?.includes("quota") || aiError?.status === 429;

        if (isQuotaError) {
          logger.warn("AI quota exceeded, using fallback processing");
          // Use fallback processing when quota is exceeded
          return this.createFallbackProcessedArticles(rawArticles);
        }
        throw aiError;
      }

      // If no articles were processed, use fallback
      logger.warn("No articles processed by AI, using fallback");
      return this.createFallbackProcessedArticles(rawArticles);
    } catch (error) {
      logger.error("AI processing failed", error);
      this.addError(
        ErrorType.AI_PROCESSING_ERROR,
        "AI processing failed, using fallback",
        undefined,
        error
      );

      // Return fallback processed articles instead of empty array
      return this.createFallbackProcessedArticles(rawArticles);
    }
  }

  /**
   * Create fallback processed articles when AI processing fails
   */
  private createFallbackProcessedArticles(
    rawArticles: import("../types/scraping").RawArticle[]
  ): ProcessedArticle[] {
    return rawArticles.map((rawArticle) => {
      const processedArticle: ProcessedArticle = {
        id: generateArticleId(),
        title: rawArticle.title,
        content: rawArticle.content,
        summary: this.generateFallbackSummary(rawArticle.content),
        author: rawArticle.author,
        publishDate: rawArticle.publishDate,
        category: this.standardizeCategory(rawArticle.category),
        tags: this.generateFallbackTags(
          rawArticle.content,
          rawArticle.category
        ),
        imageUrls: rawArticle.imageUrls,
        metadata: rawArticle.metadata,
        aiProcessingMetadata: {
          processingTimestamp: new Date(),
          modelUsed: "fallback",
          confidenceScore: 0.7,
          originalWordCount: rawArticle.metadata.wordCount,
          processedWordCount: rawArticle.metadata.wordCount,
        },
      };

      return processedArticle;
    });
  }

  /**
   * Generate fallback summary
   */
  private generateFallbackSummary(content: string): string {
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10);
    const firstTwoSentences = sentences.slice(0, 2).join(". ").trim();
    return firstTwoSentences.length > 20
      ? firstTwoSentences + "."
      : content.substring(0, 200) + "...";
  }

  /**
   * Standardize category names
   */
  private standardizeCategory(category: string): string {
    if (!category) return "General";
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("politic")) return "Politics";
    if (categoryLower.includes("sport")) return "Sports";
    if (categoryLower.includes("business") || categoryLower.includes("economy"))
      return "Business";
    if (categoryLower.includes("entertainment")) return "Entertainment";
    return "General";
  }

  /**
   * Generate fallback tags
   */
  private generateFallbackTags(content: string, category: string): string[] {
    const commonTags: Record<string, string[]> = {
      Politics: ["politics", "government", "policy", "ghana"],
      Sports: ["sports", "athletics", "competition", "ghana"],
      Business: ["business", "economy", "finance", "ghana"],
      Entertainment: ["entertainment", "culture", "ghana"],
      General: ["news", "ghana", "africa"],
    };

    const categoryTags = commonTags[category] || commonTags.General;
    const contentLower = content.toLowerCase();

    const relevantTags = categoryTags.filter(
      (tag) => contentLower.includes(tag) || contentLower.includes(tag + "s")
    );

    return relevantTags.length > 0
      ? relevantTags.slice(0, 5)
      : ["news", "ghana"];
  }

  /**
   * Store processed articles in memory
   */
  private async storeProcessedArticles(
    articles: ProcessedArticle[]
  ): Promise<void> {
    try {
      logger.info(`Storing ${articles.length} processed articles`);
      articleStorage.storeArticles(articles);

      // Log storage statistics
      const stats = articleStorage.getStorageStats();
      logger.info(
        `Storage stats: ${stats.totalArticles} total articles, ${JSON.stringify(stats.categoryCounts)}`
      );
    } catch (error) {
      logger.error("Failed to store processed articles", error);
      this.addError(
        ErrorType.VALIDATION_ERROR,
        "Failed to store articles",
        undefined,
        error
      );
    }
  }

  /**
   * Perform cleanup operations
   */
  private async performCleanup(): Promise<void> {
    try {
      logger.info("Starting cleanup operations");

      // Clean up old articles
      const removedOld = articleStorage.cleanupOldArticles();
      logger.info(`Removed ${removedOld} old articles`);

      // Remove duplicates
      const removedDuplicates = articleStorage.removeDuplicates();
      logger.info(`Removed ${removedDuplicates} duplicate articles`);

      // Clear URL discovery cache
      websiteDiscovery.clearDiscoveredUrls();
    } catch (error) {
      logger.error("Cleanup operations failed", error);
      this.addError(
        ErrorType.VALIDATION_ERROR,
        "Cleanup failed",
        undefined,
        error
      );
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await websiteDiscovery.closeBrowser();
        this.browser = null;
      }
      logger.info("Pipeline cleanup completed");
    } catch (error) {
      logger.error("Failed to cleanup pipeline resources", error);
    }
  }

  /**
   * Reset metrics for new run
   */
  private resetMetrics(): void {
    this.currentRunMetrics = {
      startTime: new Date(),
      urlsDiscovered: 0,
      articlesExtracted: 0,
      articlesProcessed: 0,
      errors: [],
    };
  }

  /**
   * Add error to current run metrics
   */
  private addError(
    type: ErrorType,
    message: string,
    url?: string,
    context?: any
  ): void {
    const error: ScrapingError = {
      type,
      message,
      url,
      timestamp: new Date(),
      retryable: type === ErrorType.NETWORK_ERROR,
      context: context ? { error: context.message || context } : undefined,
    };

    this.currentRunMetrics.errors.push(error);
  }

  /**
   * Create scraping result from current metrics
   */
  private createResult(): ScrapingResult {
    const endTime = new Date();
    const processingTime =
      endTime.getTime() - this.currentRunMetrics.startTime.getTime();

    return {
      totalArticlesProcessed: this.currentRunMetrics.articlesProcessed,
      successfulArticles: this.currentRunMetrics.articlesProcessed,
      failedArticles:
        this.currentRunMetrics.articlesExtracted -
        this.currentRunMetrics.articlesProcessed,
      processingTime,
      errors: this.currentRunMetrics.errors,
    };
  }

  /**
   * Get current pipeline status
   */
  getPipelineStatus(): {
    isRunning: boolean;
    currentMetrics: {
      startTime: Date;
      urlsDiscovered: number;
      articlesExtracted: number;
      articlesProcessed: number;
      errors: ScrapingError[];
    };
    storageStats: any;
  } {
    return {
      isRunning: this.isRunning,
      currentMetrics: this.currentRunMetrics,
      storageStats: articleStorage.getStorageStats(),
    };
  }

  /**
   * Get pipeline metrics and statistics
   */
  getPipelineMetrics(): {
    discoveryStats: any;
    extractionStats: any;
    processingStats: any;
    storageStats: any;
  } {
    return {
      discoveryStats: websiteDiscovery.getDiscoveryStats(),
      extractionStats: articleExtraction.getExtractionStats(),
      processingStats: aiProcessing.getProcessingStats(),
      storageStats: articleStorage.getStorageStats(),
    };
  }

  /**
   * Handle pipeline errors with retry logic
   */
  async handleErrors(error: ScrapingError): Promise<void> {
    logger.error(`Handling pipeline error: ${error.type}`, error);

    if (error.retryable) {
      logger.info(
        `Error is retryable, implementing retry logic for: ${error.message}`
      );
      // Implement exponential backoff retry logic here if needed
      await sleep(5000); // Simple delay for now
    } else {
      logger.warn(`Error is not retryable: ${error.message}`);
    }
  }

  /**
   * Test the complete pipeline with a small sample
   */
  async testPipeline(): Promise<ScrapingResult> {
    logger.info("Starting pipeline test with limited scope");

    // Temporarily reduce limits for testing
    const originalMaxArticles = scrapingConfig.maxArticlesPerRun;
    (scrapingConfig as any).maxArticlesPerRun = 5; // Test with only 5 articles

    try {
      const result = await this.executeDailyPipeline();
      logger.info("Pipeline test completed", result);
      return result;
    } finally {
      // Restore original limits
      (scrapingConfig as any).maxArticlesPerRun = originalMaxArticles;
    }
  }

  /**
   * Emergency stop for the pipeline
   */
  async emergencyStop(): Promise<void> {
    logger.warn("Emergency stop requested for scraping pipeline");

    if (this.isRunning) {
      this.isRunning = false;
      await this.cleanup();
      logger.info("Pipeline emergency stop completed");
    }
  }
}

// Export singleton instance
export const scrapingOrchestrator = new ScrapingOrchestrator();
