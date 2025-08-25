/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RawArticle, ProcessedArticle, AIMetadata } from "../types/scraping";
import { logger } from "../utils/logger";
import { generateArticleId, sleep } from "../utils/scraping-utils";
import { aiConfig } from "../config/scraping-config";
import { env } from "../config/env";

export class AIProcessingService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: aiConfig.model });
  }

  /**
   * Process a batch of raw articles through AI
   */
  async processBatch(articles: RawArticle[]): Promise<ProcessedArticle[]> {
    const processedArticles: ProcessedArticle[] = [];
    const batchSize = Math.min(articles.length, aiConfig.batchSize);

    logger.info(`Processing batch of ${articles.length} articles`);

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);

      try {
        const batchResults = await this.processBatchInternal(batch);
        processedArticles.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < articles.length) {
          await sleep(2000);
        }
      } catch (error) {
        logger.error(`Failed to process batch starting at index ${i}`, error);

        // Try processing articles individually as fallback
        for (const article of batch) {
          try {
            const processed = await this.processIndividualArticle(article);
            if (processed) {
              processedArticles.push(processed);
            }
          } catch (individualError) {
            logger.error(
              `Failed to process individual article: ${article.title}`,
              individualError
            );
          }
        }
      }
    }

    logger.info(
      `Successfully processed ${processedArticles.length} out of ${articles.length} articles`
    );
    return processedArticles;
  }

  /**
   * Process a batch of articles internally
   */
  private async processBatchInternal(
    articles: RawArticle[]
  ): Promise<ProcessedArticle[]> {
    const prompt = this.createBatchPrompt(articles);

    try {
      const result = await this.makeAPICallWithRetry(async () => {
        return await this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: aiConfig.temperature,
            maxOutputTokens: aiConfig.maxTokens,
          },
        });
      });

      const response = result.response;
      const text = response.text();

      return this.parseBatchResponse(text, articles);
    } catch (error) {
      logger.error("AI batch processing failed", error);
      throw error;
    }
  }

  /**
   * Make API call with retry logic for rate limiting
   */
  private async makeAPICallWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        const isRateLimited = error?.status === 429;
        const isQuotaExceeded = error?.errorDetails?.some((detail: any) =>
          detail["@type"]?.includes("QuotaFailure")
        );

        if ((isRateLimited || isQuotaExceeded) && attempt < maxRetries) {
          // Extract retry delay from error or use exponential backoff
          let retryDelay = 5000; // Default 5 seconds

          if (error?.errorDetails) {
            const retryInfo = error.errorDetails.find((detail: any) =>
              detail["@type"]?.includes("RetryInfo")
            );
            if (retryInfo?.retryDelay) {
              // Parse retry delay (e.g., "43s" -> 43000ms)
              const delayMatch = retryInfo.retryDelay.match(/(\d+)s/);
              if (delayMatch) {
                retryDelay = parseInt(delayMatch[1]) * 1000;
              }
            }
          } else {
            // Exponential backoff: 5s, 10s, 20s
            retryDelay = 5000 * Math.pow(2, attempt - 1);
          }

          logger.warn(
            `Rate limited. Retrying in ${retryDelay / 1000}s (attempt ${attempt}/${maxRetries})`
          );
          await sleep(retryDelay);
          continue;
        }

        // If it's a quota error and we've exhausted retries, throw a more informative error
        if (isQuotaExceeded) {
          throw new Error(
            "Gemini API quota exceeded. Please wait before making more requests or upgrade your plan."
          );
        }

        throw error;
      }
    }

    throw new Error("Max retries exceeded");
  }

  /**
   * Process a single article through AI
   */
  async processIndividualArticle(
    article: RawArticle
  ): Promise<ProcessedArticle | null> {
    try {
      const prompt = this.createIndividualPrompt(article);

      const result = await this.makeAPICallWithRetry(async () => {
        return await this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: aiConfig.temperature,
            maxOutputTokens: aiConfig.maxTokens, // Use full token limit for detailed content
          },
        });
      });

      const response = result.response;
      const text = response.text();

      return this.parseIndividualResponse(text, article);
    } catch (error) {
      logger.error(
        `Failed to process individual article: ${article.title}`,
        error
      );
      return null;
    }
  }

  /**
   * Create prompt for batch processing
   */
  private createBatchPrompt(articles: RawArticle[]): string {
    const articlesData = articles.map((article, index) => ({
      index,
      title: article.title,
      content: article.content.substring(0, 3000), // Increased content length for more context
      author: article.author,
      category: article.category,
      imageUrls: article.imageUrls,
    }));

    return `You are a professional news editor and investigative journalist. Please rewrite and significantly expand the following ${articles.length} news articles while following these strict rules:

CRITICAL RULES:
1. PRESERVE ALL IMAGE URLs EXACTLY AS PROVIDED - DO NOT MODIFY, PROCESS, OR CHANGE THEM IN ANY WAY
2. CREATE COMPREHENSIVE, DETAILED ARTICLES that are 3-5 times longer than the original
3. Maintain 100% factual accuracy - never add fictional details or events
4. Create engaging, professional headlines that are different from the original
5. Generate detailed summaries (4-5 sentences) that capture the full scope
6. Standardize categories to: Politics, Sports, Business, Entertainment, or General
7. Generate 5-7 relevant, specific tags for each article
8. Keep the same author name

CONTENT EXPANSION REQUIREMENTS:
- Provide comprehensive background context and historical perspective
- Explain the significance and broader implications of the events
- Include relevant details about key figures, organizations, and locations mentioned
- Analyze potential impacts on society, economy, or politics where relevant
- Add proper journalistic structure with clear paragraphs and logical flow
- Ensure the expanded content remains factually grounded in the original information
- Write in a professional, engaging news style suitable for serious readers
- Aim for 800-1500 words per article while staying completely within the factual bounds of the original

Articles to process:
${articlesData
  .map(
    (article) => `
ARTICLE ${article.index}:
Title: ${article.title}
Content: ${article.content}
Author: ${article.author}
Category: ${article.category}
Image URLs: ${JSON.stringify(article.imageUrls)}
`
  )
  .join("\n---\n")}

Please respond with a JSON array containing the processed articles in this exact format:
[
  {
    "index": 0,
    "title": "Compelling, professional headline",
    "content": "Comprehensive, detailed article content (800-1500 words) maintaining complete factual accuracy",
    "summary": "Detailed 4-5 sentence summary capturing the full scope and significance",
    "author": "Same author name",
    "category": "Standardized category",
    "tags": ["specific", "relevant", "tags", "for", "article", "context", "impact"],
    "imageUrls": [exact same URLs as provided],
    "confidenceScore": 0.9
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text or formatting.`;
  }

  /**
   * Create prompt for individual article processing
   */
  private createIndividualPrompt(article: RawArticle): string {
    return `You are a professional news editor and investigative journalist. Please rewrite and significantly expand this news article while following these strict rules:

CRITICAL RULES:
1. PRESERVE ALL IMAGE URLs EXACTLY AS PROVIDED - DO NOT MODIFY THEM: ${JSON.stringify(article.imageUrls)}
2. CREATE COMPREHENSIVE, DETAILED ARTICLES that are 3-5 times longer than the original
3. Maintain 100% factual accuracy - never add fictional details or events
4. Create engaging, professional headlines that are different from the original
5. Generate detailed summaries (4-5 sentences) that capture the full scope
6. Standardize category to: Politics, Sports, Business, Entertainment, or General
7. Generate 5-7 relevant, specific tags for the article
8. Keep the same author name: ${article.author}

CONTENT EXPANSION REQUIREMENTS:
- Provide comprehensive background context and historical perspective
- Explain the significance and broader implications of the events
- Include relevant details about key figures, organizations, and locations mentioned
- Analyze potential impacts on society, economy, or politics where relevant
- Add proper journalistic structure with clear paragraphs and logical flow
- Ensure the expanded content remains factually grounded in the original information
- Write in a professional, engaging news style suitable for serious readers
- Aim for 800-1500 words while staying completely within the factual bounds of the original
- Structure the content with clear introduction, body paragraphs, and conclusion
- Use transitional phrases and maintain coherent narrative flow

ORIGINAL ARTICLE:
Title: ${article.title}
Content: ${article.content}
Author: ${article.author}
Category: ${article.category}
Image URLs: ${JSON.stringify(article.imageUrls)}

Please respond with a JSON object in this exact format:
{
  "title": "Compelling, professional headline that captures the essence",
  "content": "Comprehensive, detailed article content (800-1500 words) with proper journalistic structure, maintaining complete factual accuracy while providing extensive context, analysis, and implications",
  "summary": "Detailed 4-5 sentence summary that captures the full scope, significance, and broader implications of the story",
  "author": "${article.author}",
  "category": "Standardized category from the list above",
  "tags": ["specific", "relevant", "tags", "capturing", "key", "themes", "impact"],
  "imageUrls": ${JSON.stringify(article.imageUrls)},
  "confidenceScore": 0.9
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;
  }

  /**
   * Parse batch response from AI
   */
  private parseBatchResponse(
    response: string,
    originalArticles: RawArticle[]
  ): ProcessedArticle[] {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      const processedArticles: ProcessedArticle[] = [];

      for (const item of parsedResponse) {
        const originalArticle = originalArticles[item.index];
        if (!originalArticle) continue;

        const processedArticle = this.createProcessedArticle(
          item,
          originalArticle
        );
        if (processedArticle) {
          processedArticles.push(processedArticle);
        }
      }

      return processedArticles;
    } catch (error) {
      logger.error("Failed to parse batch AI response", {
        error,
        response: response.substring(0, 500),
      });
      throw error;
    }
  }

  /**
   * Parse individual response from AI
   */
  private parseIndividualResponse(
    response: string,
    originalArticle: RawArticle
  ): ProcessedArticle | null {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      return this.createProcessedArticle(parsedResponse, originalArticle);
    } catch (error) {
      logger.error("Failed to parse individual AI response", {
        error,
        response: response.substring(0, 500),
      });
      return null;
    }
  }

  /**
   * Create processed article from AI response and original article
   */
  private createProcessedArticle(
    aiResponse: any,
    originalArticle: RawArticle
  ): ProcessedArticle | null {
    try {
      // Validate AI response
      if (!aiResponse.title || !aiResponse.content || !aiResponse.summary) {
        logger.warn("Invalid AI response: missing required fields");
        return null;
      }

      // Ensure image URLs are preserved exactly
      const imageUrls = Array.isArray(aiResponse.imageUrls)
        ? aiResponse.imageUrls
        : originalArticle.imageUrls;

      const aiMetadata: AIMetadata = {
        processingTimestamp: new Date(),
        modelUsed: aiConfig.model,
        confidenceScore: aiResponse.confidenceScore || 0.8,
        originalWordCount: originalArticle.metadata.wordCount,
        processedWordCount: this.countWords(aiResponse.content),
      };

      const processedArticle: ProcessedArticle = {
        id: generateArticleId(),
        title: aiResponse.title.trim(),
        content: aiResponse.content.trim(),
        summary: aiResponse.summary.trim(),
        author: aiResponse.author || originalArticle.author,
        publishDate: originalArticle.publishDate,
        category: this.standardizeCategory(aiResponse.category),
        tags: Array.isArray(aiResponse.tags) ? aiResponse.tags : [],
        imageUrls: imageUrls, // Preserved exactly from original
        metadata: originalArticle.metadata,
        aiProcessingMetadata: aiMetadata,
      };

      // Validate processed article
      if (!this.validateProcessedArticle(processedArticle)) {
        logger.warn("Processed article failed validation");
        return null;
      }

      return processedArticle;
    } catch (error) {
      logger.error("Failed to create processed article", error);
      return null;
    }
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
   * Generate tags for content (fallback if AI doesn't provide good tags)
   */
  generateTags(content: string, category: string): string[] {
    const commonTags: Record<string, string[]> = {
      Politics: ["politics", "government", "policy", "election", "democracy"],
      Sports: ["sports", "athletics", "competition", "team", "player"],
      Business: ["business", "economy", "finance", "market", "industry"],
      Entertainment: [
        "entertainment",
        "celebrity",
        "music",
        "movie",
        "culture",
      ],
      General: ["news", "ghana", "africa", "society", "community"],
    };

    const categoryTags = commonTags[category] || commonTags.General;
    const contentLower = content.toLowerCase();

    // Find relevant tags based on content
    const relevantTags = categoryTags.filter(
      (tag) => contentLower.includes(tag) || contentLower.includes(tag + "s")
    );

    // Add Ghana-specific tags
    if (contentLower.includes("ghana") || contentLower.includes("accra")) {
      relevantTags.push("ghana");
    }

    return relevantTags.slice(0, 5); // Limit to 5 tags
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Validate processed article
   */
  private validateProcessedArticle(article: ProcessedArticle): boolean {
    if (!article.title || article.title.length < 10) return false;
    if (!article.content || article.content.length < 500) return false; // Increased minimum for detailed content
    if (!article.summary || article.summary.length < 50) return false; // Increased for detailed summaries
    if (!article.category) return false;
    if (!Array.isArray(article.tags) || article.tags.length < 3) return false; // Require at least 3 tags
    if (!Array.isArray(article.imageUrls)) return false;

    // Additional validation for detailed content
    const wordCount = this.countWords(article.content);
    if (wordCount < 200) return false; // Ensure substantial content

    return true;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    successRate: number;
    averageConfidenceScore: number;
  } {
    // This would be implemented with actual tracking in a real system
    return {
      totalProcessed: 0,
      successRate: 0.9,
      averageConfidenceScore: 0.85,
    };
  }

  /**
   * Test AI processing with a single article (for debugging)
   */
  async testProcessing(article: RawArticle): Promise<ProcessedArticle | null> {
    logger.info(`Testing AI processing for article: ${article.title}`);

    try {
      const processed = await this.processIndividualArticle(article);
      if (processed) {
        logger.info("Test processing successful");
        logger.info(`Original title: ${article.title}`);
        logger.info(`Processed title: ${processed.title}`);
        logger.info(`Summary: ${processed.summary}`);
        logger.info(`Tags: ${processed.tags.join(", ")}`);
        logger.info(`Images preserved: ${processed.imageUrls.length}`);
      }
      return processed;
    } catch (error) {
      logger.error("Test processing failed", error);
      return null;
    }
  }
}

// Export singleton instance
export const aiProcessing = new AIProcessingService();
