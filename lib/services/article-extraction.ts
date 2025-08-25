import { Browser, Page } from "puppeteer";
import { RawArticle, ArticleMetadata, WebsiteConfig } from "../types/scraping";
import { logger } from "../utils/logger";
import { generateArticleId, sleep } from "../utils/scraping-utils";
import { scrapingConfig } from "../config/scraping-config";

export class ArticleExtractionService {
  private browser: Browser | null = null;

  /**
   * Set browser instance (shared with discovery service)
   */
  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  /**
   * Extract article data from a single URL
   */
  async extractArticleData(url: string): Promise<RawArticle | null> {
    if (!this.browser) {
      throw new Error("Browser not initialized. Call setBrowser() first.");
    }

    const page = await this.browser.newPage();

    try {
      // Find the appropriate website configuration
      const websiteConfig = this.findWebsiteConfig(url);
      if (!websiteConfig) {
        logger.warn(`No configuration found for URL: ${url}`);
        return null;
      }

      logger.info(`Extracting article data from: ${url}`);

      // Set user agent and navigate to page
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: scrapingConfig.timeoutMs,
      });

      // Wait for content to load
      await sleep(2000);

      // Extract article data using the page evaluation
      const articleData = await page.evaluate(
        (selectors, sourceUrl) => {
          // Helper function to get text content from selector
          const getTextContent = (selector: string): string => {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              const text = element.textContent?.trim();
              if (text && text.length > 0) {
                return text;
              }
            }
            return "";
          };

          // Helper function to get all text content from multiple elements
          const getAllTextContent = (selector: string): string => {
            const elements = document.querySelectorAll(selector);
            const texts: string[] = [];

            elements.forEach((element) => {
              const text = element.textContent?.trim();
              if (text && text.length > 10) {
                // Filter out very short text
                texts.push(text);
              }
            });

            return texts.join("\n\n");
          };

          // Helper function to extract image URLs
          const getImageUrls = (selector: string): string[] => {
            const images = document.querySelectorAll(selector);
            const urls: string[] = [];

            images.forEach((img) => {
              const src = img.getAttribute("src");
              if (src) {
                // Convert relative URLs to absolute
                const fullUrl = src.startsWith("http")
                  ? src
                  : new URL(src, window.location.origin).href;
                // Filter out small images (likely icons/logos)
                if (
                  !src.includes("logo") &&
                  !src.includes("icon") &&
                  !src.includes("avatar")
                ) {
                  urls.push(fullUrl);
                }
              }
            });

            return [...new Set(urls)]; // Remove duplicates
          };

          // Extract title
          const title =
            getTextContent(selectors.title) ||
            document.title ||
            getTextContent("h1") ||
            "Untitled Article";

          // Extract content
          let content = getAllTextContent(selectors.content);
          if (!content) {
            // Fallback to common content selectors
            content = getAllTextContent(
              "article, .article, .post, .entry-content, .story-body, main p"
            );
          }

          // Extract author
          const author =
            getTextContent(selectors.author) ||
            getTextContent('.author, .byline, .writer, [rel="author"]') ||
            "Unknown Author";

          // Extract publish date
          let publishDate =
            getTextContent(selectors.publishDate) ||
            getTextContent(".date, .publish-date, .timestamp, time") ||
            getTextContent("[datetime]");

          // Try to get datetime attribute if available
          if (!publishDate) {
            const timeElement = document.querySelector("time[datetime]");
            if (timeElement) {
              publishDate = timeElement.getAttribute("datetime") || "";
            }
          }

          // Extract images
          const imageUrls = getImageUrls(selectors.images);

          // Determine category based on URL or content
          let category = "General";
          const urlLower = sourceUrl.toLowerCase();
          if (urlLower.includes("politic") || urlLower.includes("politik")) {
            category = "Politics";
          } else if (urlLower.includes("sport")) {
            category = "Sports";
          } else if (
            urlLower.includes("business") ||
            urlLower.includes("economy")
          ) {
            category = "Business";
          } else if (urlLower.includes("entertainment")) {
            category = "Entertainment";
          }

          return {
            title: title.substring(0, 200), // Limit title length
            content: content.substring(0, 5000), // Limit content length
            author: author.substring(0, 100), // Limit author length
            publishDate: publishDate || new Date().toISOString(),
            category,
            imageUrls: imageUrls.slice(0, 5), // Limit to 5 images
          };
        },
        websiteConfig.selectors,
        url
      );

      // Create metadata
      const metadata: ArticleMetadata = {
        scrapingTimestamp: new Date(),
        sourceUrl: url,
        wordCount: this.countWords(articleData.content),
        estimatedReadTime: Math.ceil(
          this.countWords(articleData.content) / 200
        ),
      };

      // Create raw article object
      const rawArticle: RawArticle = {
        url,
        title: articleData.title,
        content: articleData.content,
        author: articleData.author,
        publishDate: articleData.publishDate,
        category: articleData.category,
        imageUrls: articleData.imageUrls,
        metadata,
      };

      // Log extracted data for debugging
      logger.info(`Extracted data from ${url}:`, {
        titleLength: articleData.title.length,
        contentLength: articleData.content.length,
        author: articleData.author,
        imageCount: articleData.imageUrls.length,
      });

      // Validate extracted data
      if (!this.validateExtractedData(rawArticle)) {
        logger.warn(`Invalid article data extracted from: ${url}`, {
          title: rawArticle.title,
          contentLength: rawArticle.content.length,
          author: rawArticle.author,
        });
        return null;
      }

      logger.info(
        `Successfully extracted article: ${rawArticle.title.substring(0, 50)}...`
      );
      return rawArticle;
    } catch (error) {
      logger.error(`Failed to extract article data from: ${url}`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Extract multiple articles in batch
   */
  async extractMultipleArticles(urls: string[]): Promise<RawArticle[]> {
    const articles: RawArticle[] = [];
    const maxConcurrent = 3; // Limit concurrent extractions

    logger.info(`Starting batch extraction of ${urls.length} articles`);

    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map((url) => this.extractArticleData(url));

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            articles.push(result.value);
          } else {
            logger.warn(`Failed to extract article from: ${batch[index]}`);
          }
        });

        // Add delay between batches to be respectful
        if (i + maxConcurrent < urls.length) {
          await sleep(3000);
        }
      } catch (error) {
        logger.error(
          `Batch extraction failed for batch starting at index ${i}`,
          error
        );
      }
    }

    logger.info(
      `Successfully extracted ${articles.length} out of ${urls.length} articles`
    );
    return articles;
  }

  /**
   * Find website configuration for a given URL
   */
  private findWebsiteConfig(url: string): WebsiteConfig | null {
    try {
      const urlObj = new URL(url);
      return (
        scrapingConfig.targetWebsites.find((config) => {
          const configUrl = new URL(config.baseUrl);
          return urlObj.hostname === configUrl.hostname;
        }) || null
      );
    } catch {
      return null;
    }
  }

  /**
   * Count words in text content
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Validate extracted article data
   */
  private validateExtractedData(article: RawArticle): boolean {
    // Check required fields
    if (!article.title || article.title.length < 10) {
      return false;
    }

    if (!article.content || article.content.length < 100) {
      return false;
    }

    if (!article.author || article.author === "Unknown Author") {
      // Allow articles without author but log it
      logger.warn(`Article without author: ${article.title}`);
    }

    // Check if content seems to be actual article content
    const contentWords = this.countWords(article.content);
    if (contentWords < 50) {
      return false;
    }

    return true;
  }

  /**
   * Extract additional metadata from page (SEO and social media tags)
   */
  async extractAdditionalMetadata(page: Page): Promise<{
    description?: string;
    keywords?: string;
    ogImage?: string;
    publishedTime?: string;
  }> {
    try {
      const metadata = await page.evaluate(() => {
        // Extract meta tags
        const getMetaContent = (name: string): string => {
          const meta = document.querySelector(
            `meta[name="${name}"], meta[property="${name}"]`
          );
          return meta?.getAttribute("content") || "";
        };

        return {
          description:
            getMetaContent("description") || getMetaContent("og:description"),
          keywords: getMetaContent("keywords"),
          ogImage: getMetaContent("og:image"),
          publishedTime:
            getMetaContent("article:published_time") ||
            getMetaContent("og:published_time"),
        };
      });

      return metadata;
    } catch (error) {
      logger.error("Failed to extract additional metadata", error);
      return {};
    }
  }

  /**
   * Get extraction statistics
   */
  getExtractionStats(): {
    successRate: number;
    averageWordCount: number;
    totalExtracted: number;
  } {
    // This would be implemented with actual tracking in a real system
    return {
      successRate: 0.85, // 85% success rate
      averageWordCount: 450,
      totalExtracted: 0,
    };
  }

  /**
   * Test article extraction for a specific URL (useful for debugging)
   */
  async testArticleExtraction(
    url: string,
    browser: Browser
  ): Promise<RawArticle | null> {
    this.setBrowser(browser);

    try {
      const article = await this.extractArticleData(url);
      if (article) {
        logger.info(`Test extraction successful for: ${url}`);
        logger.info(`Title: ${article.title}`);
        logger.info(`Content length: ${article.content.length} characters`);
        logger.info(`Images found: ${article.imageUrls.length}`);
      }
      return article;
    } catch (error) {
      logger.error(`Test extraction failed for: ${url}`, error);
      return null;
    }
  }
}

// Export singleton instance
export const articleExtraction = new ArticleExtractionService();
