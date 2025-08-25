import { ErrorType, ScrapingError } from "../types/scraping";
import { logger } from "./logger";

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<ErrorType, number> = new Map();
  private recentErrors: ScrapingError[] = [];
  private maxRecentErrors = 100;

  private constructor() {
    // Initialize error counts
    Object.values(ErrorType).forEach((type) => {
      this.errorCounts.set(type, 0);
    });
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create and log a scraping error
   */
  createError(
    type: ErrorType,
    message: string,
    url?: string,
    context?: Record<string, any>
  ): ScrapingError {
    const error: ScrapingError = {
      type,
      message,
      url,
      timestamp: new Date(),
      retryable: this.isRetryable(type),
      context,
    };

    this.logError(error);
    this.trackError(error);

    return error;
  }

  /**
   * Handle and process an error
   */
  async handleError(error: ScrapingError): Promise<void> {
    logger.error(`Handling ${error.type} error`, {
      message: error.message,
      url: error.url,
      retryable: error.retryable,
      context: error.context,
    });

    // Implement specific handling based on error type
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        await this.handleNetworkError(error);
        break;
      case ErrorType.PARSING_ERROR:
        await this.handleParsingError(error);
        break;
      case ErrorType.AI_PROCESSING_ERROR:
        await this.handleAIError(error);
        break;
      case ErrorType.VALIDATION_ERROR:
        await this.handleValidationError(error);
        break;
      default:
        logger.warn(`Unknown error type: ${error.type}`);
    }
  }

  /**
   * Handle network-related errors with retry logic
   */
  private async handleNetworkError(error: ScrapingError): Promise<void> {
    if (error.retryable) {
      const retryCount = error.context?.retryCount || 0;
      const maxRetries = 3;

      if (retryCount < maxRetries) {
        const delay = this.calculateBackoffDelay(retryCount);
        logger.info(`Scheduling retry for network error`, {
          url: error.url,
          retryCount: retryCount + 1,
          delay,
        });

        // In a real implementation, you would schedule the retry
        // For now, we just log the intention
        await this.sleep(delay);
      } else {
        logger.error(`Max retries exceeded for network error`, {
          url: error.url,
          maxRetries,
        });
      }
    }
  }

  /**
   * Handle parsing errors
   */
  private async handleParsingError(error: ScrapingError): Promise<void> {
    logger.warn(`Parsing error encountered`, {
      url: error.url,
      message: error.message,
    });

    // Parsing errors are typically not retryable
    // Log for analysis and continue with other articles
  }

  /**
   * Handle AI processing errors
   */
  private async handleAIError(error: ScrapingError): Promise<void> {
    if (error.retryable) {
      const retryCount = error.context?.retryCount || 0;
      const maxRetries = 2; // Fewer retries for AI errors

      if (retryCount < maxRetries) {
        const delay = this.calculateBackoffDelay(retryCount, 5000); // Longer base delay
        logger.info(`Scheduling retry for AI error`, {
          retryCount: retryCount + 1,
          delay,
        });

        await this.sleep(delay);
      } else {
        logger.error(`Max AI retries exceeded`, {
          message: error.message,
          maxRetries,
        });
      }
    }
  }

  /**
   * Handle validation errors
   */
  private async handleValidationError(error: ScrapingError): Promise<void> {
    logger.warn(`Validation error`, {
      message: error.message,
      context: error.context,
    });

    // Validation errors are typically not retryable
    // Log for debugging and skip the problematic item
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(
    retryCount: number,
    baseDelay: number = 1000
  ): number {
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(baseDelay * Math.pow(2, retryCount) + jitter, 30000); // Max 30 seconds
  }

  /**
   * Determine if an error type is retryable
   */
  private isRetryable(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.AI_PROCESSING_ERROR:
        return true;
      case ErrorType.PARSING_ERROR:
      case ErrorType.VALIDATION_ERROR:
        return false;
      default:
        return false;
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: ScrapingError): void {
    const logData = {
      type: error.type,
      message: error.message,
      url: error.url,
      retryable: error.retryable,
      context: error.context,
    };

    if (error.type === ErrorType.NETWORK_ERROR && error.retryable) {
      logger.warn("Retryable network error", logData);
    } else if (error.type === ErrorType.VALIDATION_ERROR) {
      logger.warn("Validation error", logData);
    } else {
      logger.error("Scraping error", logData);
    }
  }

  /**
   * Track error for monitoring
   */
  private trackError(error: ScrapingError): void {
    // Increment error count
    const currentCount = this.errorCounts.get(error.type) || 0;
    this.errorCounts.set(error.type, currentCount + 1);

    // Add to recent errors
    this.recentErrors.push(error);
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.shift();
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrorsCount: number;
    errorRate: number;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const errorsByType: Record<string, number> = {};

    this.errorCounts.forEach((count, type) => {
      errorsByType[type] = count;
    });

    // Calculate error rate (errors in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.recentErrors.filter(
      (error) => error.timestamp > oneHourAgo
    );
    const errorRate = recentErrors.length;

    return {
      totalErrors,
      errorsByType,
      recentErrorsCount: this.recentErrors.length,
      errorRate,
    };
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): ScrapingError[] {
    return this.recentErrors
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if error rate is above threshold
   */
  isErrorRateHigh(threshold: number = 10): boolean {
    const stats = this.getErrorStats();
    return stats.errorRate > threshold;
  }

  /**
   * Clear error statistics (useful for testing)
   */
  clearStats(): void {
    this.errorCounts.clear();
    this.recentErrors = [];

    // Reinitialize error counts
    Object.values(ErrorType).forEach((type) => {
      this.errorCounts.set(type, 0);
    });
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create error from caught exception
   */
  static fromException(
    exception: unknown,
    type: ErrorType = ErrorType.NETWORK_ERROR,
    url?: string,
    context?: Record<string, any>
  ): ScrapingError {
    const handler = ErrorHandler.getInstance();

    let message = "Unknown error occurred";
    if (exception instanceof Error) {
      message = exception.message;
      context = { ...context, stack: exception.stack };
    } else if (typeof exception === "string") {
      message = exception;
    }

    return handler.createError(type, message, url, context);
  }

  /**
   * Wrap async function with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    errorType: ErrorType = ErrorType.NETWORK_ERROR,
    url?: string,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      const scrapingError = ErrorHandler.fromException(
        error,
        errorType,
        url,
        context
      );
      const handler = ErrorHandler.getInstance();
      await handler.handleError(scrapingError);
      return null;
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
