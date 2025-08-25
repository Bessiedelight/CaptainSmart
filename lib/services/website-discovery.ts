import puppeteer, { Browser } from "puppeteer";
import { WebsiteConfig } from "../types/scraping";
import { logger } from "../utils/logger";
import { isValidUrl, sleep } from "../utils/scraping-utils";
import { scrapingConfig } from "../config/scraping-config";

export class WebsiteDiscoveryService {
  private browser: Browser | null = null;
  private discoveredUrls: Set<string> = new Set();

  /**
   * Initialize Puppeteer browser
   */
  async initBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      });
      logger.info("Puppeteer browser initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Puppeteer browser", error);
      throw error;
    }
  }

  /**
   * Close Puppeteer browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info("Puppeteer browser closed");
    }
  }

  /**
   * Discover article URLs from all configured websites
   */
  async discoverAllArticleUrls(): Promise<string[]> {
    if (!this.browser) {
      await this.initBrowser();
    }

    const allUrls: string[] = [];

    for (const website of scrapingConfig.targetWebsites) {
      try {
        logger.info(`Starting URL discovery for ${website.name}`);
        const urls = await this.discoverArticleUrls(
          website.baseUrl,
          website.categoryPages,
          website
        );
        allUrls.push(...urls);
        logger.info(`Discovered ${urls.length} URLs from ${website.name}`);

        // Add delay between websites to be respectful
        await sleep(2000);
      } catch (error) {
        logger.error(`Failed to discover URLs from ${website.name}`, error);
      }
    }

    const uniqueUrls = this.filterDuplicateUrls(allUrls);
    logger.info(`Total unique URLs discovered: ${uniqueUrls.length}`);
    return uniqueUrls;
  }

  /**
   * Discover article URLs from a specific website
   */
  async discoverArticleUrls(
    baseUrl: string,
    categoryPages: string[],
    config: WebsiteConfig
  ): Promise<string[]> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    const urls: string[] = [];

    for (const categoryPath of categoryPages) {
      try {
        const fullUrl = this.buildFullUrl(baseUrl, categoryPath);
        logger.info(`Crawling category page: ${fullUrl}`);

        const categoryUrls = await this.extractUrlsFromPage(fullUrl, config);
        urls.push(...categoryUrls);

        // Add delay between category pages
        await sleep(1000);
      } catch (error) {
        logger.error(`Failed to crawl category page: ${categoryPath}`, error);
      }
    }

    return urls;
  }

  /**
   * Extract article URLs from a single page
   */
  private async extractUrlsFromPage(
    url: string,
    config: WebsiteConfig
  ): Promise<string[]> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    const page = await this.browser.newPage();
    const urls: string[] = [];

    try {
      // Set user agent to appear more like a real browser
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      // Navigate to the page with timeout
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: scrapingConfig.timeoutMs,
      });

      // Wait for content to load
      await sleep(2000);

      // Extract article links using the configured selector
      const links = await page.evaluate(
        (selector, baseUrl) => {
          const elements = document.querySelectorAll(selector);
          const urls: string[] = [];

          elements.forEach((element) => {
            const href = element.getAttribute("href");
            if (href) {
              // Convert relative URLs to absolute
              const fullUrl = href.startsWith("http")
                ? href
                : new URL(href, baseUrl).href;
              urls.push(fullUrl);
            }
          });

          return urls;
        },
        config.selectors.articleLinks,
        config.baseUrl
      );

      logger.info(
        `Found ${links.length} raw links using selector: ${config.selectors.articleLinks}`
      );

      // Log first few raw links for debugging
      if (links.length > 0) {
        logger.info(`Sample raw links: ${links.slice(0, 5).join(", ")}`);
      }

      // Filter and validate URLs
      const validUrls = links.filter((link) => {
        const isValid = this.validateArticleUrl(link, config);
        if (!isValid && links.length <= 10) {
          // Only log for small sets to avoid spam
          logger.warn(`Filtered out URL: ${link}`);
        }
        return isValid;
      });
      urls.push(...validUrls);

      logger.info(`Extracted ${validUrls.length} valid URLs from ${url}`);
    } catch (error) {
      logger.error(`Failed to extract URLs from page: ${url}`, error);
    } finally {
      await page.close();
    }

    return urls;
  }

  /**
   * Build full URL from base URL and path
   */
  private buildFullUrl(baseUrl: string, path: string): string {
    if (path.startsWith("http")) {
      return path;
    }

    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    return `${cleanBaseUrl}${cleanPath}`;
  }

  /**
   * Validate if a URL is a valid article URL
   */
  validateArticleUrl(url: string, config: WebsiteConfig): boolean {
    // Basic URL validation
    if (!isValidUrl(url)) {
      return false;
    }

    // Must be from the same domain
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(config.baseUrl);

      if (urlObj.hostname !== baseUrlObj.hostname) {
        return false;
      }
    } catch {
      return false;
    }

    // Check against common patterns to exclude
    const excludePatterns = [
      /\/search\//,
      /\/category\//,
      /\/tag\//,
      /\/author\//,
      /\/page\//,
      /\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i,
      /#/,
      /javascript:/,
      /mailto:/,
    ];

    for (const pattern of excludePatterns) {
      if (pattern.test(url)) {
        return false;
      }
    }

    // Must contain article-like patterns (customize based on site structure)
    const articlePatterns = [
      /\/news\//,
      /\/article/,
      /\/politik/,
      /\/politics/,
      /NewsArchive/,
      /artikel\.php/,
      /citinewsroom\.com\/20\d{2}\//, // CitiNewsroom year-based URLs (2024, 2025, etc.)
      /\/20\d{2}\/\d{2}\//, // General year/month pattern for articles
    ];

    const hasArticlePattern = articlePatterns.some((pattern) =>
      pattern.test(url)
    );

    // For CitiNewsroom, specifically allow year-based article URLs
    if (url.includes("citinewsroom.com")) {
      const isArticleUrl = /citinewsroom\.com\/20\d{2}\/\d{2}\//.test(url);
      const isNotJustCategoryPage =
        !url.endsWith("/news/") && !url.endsWith("/news");
      return isArticleUrl || (hasArticlePattern && isNotJustCategoryPage);
    }

    return hasArticlePattern;
  }

  /**
   * Filter duplicate URLs
   */
  filterDuplicateUrls(urls: string[]): string[] {
    const uniqueUrls = Array.from(new Set(urls));
    const filtered = uniqueUrls.filter((url) => {
      if (this.discoveredUrls.has(url)) {
        return false;
      }
      this.discoveredUrls.add(url);
      return true;
    });

    logger.info(`Filtered ${urls.length - filtered.length} duplicate URLs`);
    return filtered;
  }

  /**
   * Clear discovered URLs cache
   */
  clearDiscoveredUrls(): void {
    this.discoveredUrls.clear();
    logger.info("Cleared discovered URLs cache");
  }

  /**
   * Get statistics about discovered URLs
   */
  getDiscoveryStats(): {
    totalDiscovered: number;
    uniqueUrls: number;
  } {
    return {
      totalDiscovered: this.discoveredUrls.size,
      uniqueUrls: this.discoveredUrls.size,
    };
  }

  /**
   * Test URL discovery for a specific website (useful for debugging)
   */
  async testWebsiteDiscovery(websiteName: string): Promise<string[]> {
    const website = scrapingConfig.targetWebsites.find(
      (w) => w.name === websiteName
    );
    if (!website) {
      throw new Error(`Website configuration not found: ${websiteName}`);
    }

    if (!this.browser) {
      await this.initBrowser();
    }

    try {
      const urls = await this.discoverArticleUrls(
        website.baseUrl,
        website.categoryPages,
        website
      );
      logger.info(
        `Test discovery for ${websiteName} found ${urls.length} URLs`
      );
      return urls;
    } finally {
      await this.closeBrowser();
    }
  }
}

// Export singleton instance
export const websiteDiscovery = new WebsiteDiscoveryService();
