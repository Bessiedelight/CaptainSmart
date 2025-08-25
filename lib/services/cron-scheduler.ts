import * as cron from "node-cron";
import { logger } from "../utils/logger";
import { scrapingConfig } from "../config/scraping-config";

export class CronScheduler {
  private scheduledTask: cron.ScheduledTask | null = null;
  private isScheduled: boolean = false;
  private lastRunTime: Date | null = null;
  private nextRunTime: Date | null = null;
  private runCount: number = 0;
  private failureCount: number = 0;

  /**
   * Start the daily scraping schedule
   */
  start(): void {
    if (this.isScheduled) {
      logger.warn("Cron scheduler is already running");
      return;
    }

    try {
      // Schedule for 6:00 AM daily (0 6 * * *)
      const cronExpression = "0 6 * * *";

      logger.info(`Starting cron scheduler with expression: ${cronExpression}`);

      this.scheduledTask = cron.schedule(
        cronExpression,
        async () => {
          await this.executeDailyJob();
        },
        {
          scheduled: false, // Don't start immediately
          timezone: "UTC",
        }
      );

      // Start the scheduled task
      this.scheduledTask.start();
      this.isScheduled = true;

      // Calculate next run time
      this.calculateNextRunTime();

      logger.info("Daily scraping cron job scheduled successfully", {
        cronExpression,
        nextRun: this.nextRunTime?.toISOString(),
        timezone: "UTC",
      });
    } catch (error) {
      logger.error("Failed to start cron scheduler", error);
      throw error;
    }
  }

  /**
   * Stop the scheduled task
   */
  stop(): void {
    if (!this.isScheduled || !this.scheduledTask) {
      logger.warn("No cron scheduler is currently running");
      return;
    }

    try {
      this.scheduledTask.stop();
      this.scheduledTask.destroy();
      this.scheduledTask = null;
      this.isScheduled = false;
      this.nextRunTime = null;

      logger.info("Cron scheduler stopped successfully");
    } catch (error) {
      logger.error("Failed to stop cron scheduler", error);
    }
  }

  /**
   * Execute the daily scraping job
   */
  private async executeDailyJob(): Promise<void> {
    const jobStartTime = new Date();
    this.runCount++;

    logger.info("Starting scheduled daily scraping job", {
      runCount: this.runCount,
      scheduledTime: jobStartTime.toISOString(),
    });

    try {
      // Call the Next.js API endpoint internally
      const result = await this.triggerScrapingAPI();

      this.lastRunTime = jobStartTime;
      this.calculateNextRunTime();

      logger.info("Scheduled scraping job completed successfully", {
        runCount: this.runCount,
        duration: Date.now() - jobStartTime.getTime(),
        result: result
          ? {
              totalArticles: result.totalArticlesProcessed,
              successfulArticles: result.successfulArticles,
              failedArticles: result.failedArticles,
              errors: result.errors?.length || 0,
            }
          : null,
        nextRun: this.nextRunTime?.toISOString(),
      });
    } catch (error) {
      this.failureCount++;

      logger.error("Scheduled scraping job failed", {
        runCount: this.runCount,
        failureCount: this.failureCount,
        error: error instanceof Error ? error.message : error,
        duration: Date.now() - jobStartTime.getTime(),
      });

      // Calculate next run time even after failure
      this.calculateNextRunTime();
    }
  }

  /**
   * Trigger the scraping API endpoint internally
   */
  private async triggerScrapingAPI(): Promise<any> {
    try {
      // Import the API route handler
      const { POST } = await import("../../app/api/scraping/trigger/route");

      // Create a mock request object
      const mockRequest = {
        json: async () => ({ mode: "full" }),
        headers: {
          get: (name: string) => {
            if (name === "x-api-key") {
              return process.env.SCRAPING_API_KEY || "dev-api-key";
            }
            if (name === "user-agent") {
              return "CronScheduler/1.0";
            }
            if (name === "x-forwarded-for") {
              return "127.0.0.1";
            }
            return null;
          },
        },
      } as any;

      // Call the API handler directly
      const response = await POST(mockRequest);
      const data = await response.json();

      if (!data.success) {
        throw new Error(`API call failed: ${data.error || data.message}`);
      }

      return data.data?.result;
    } catch (error) {
      logger.error("Failed to trigger scraping API from cron job", error);
      throw error;
    }
  }

  /**
   * Calculate the next run time
   */
  private calculateNextRunTime(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // 6:00 AM

    // If it's before 6 AM today, next run is today at 6 AM
    if (now.getHours() < 6) {
      const today = new Date(now);
      today.setHours(6, 0, 0, 0);
      this.nextRunTime = today;
    } else {
      this.nextRunTime = tomorrow;
    }
  }

  /**
   * Get scheduler status and statistics
   */
  getStatus(): {
    isScheduled: boolean;
    lastRunTime: Date | null;
    nextRunTime: Date | null;
    runCount: number;
    failureCount: number;
    successRate: number;
  } {
    const successRate =
      this.runCount > 0
        ? ((this.runCount - this.failureCount) / this.runCount) * 100
        : 0;

    return {
      isScheduled: this.isScheduled,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      runCount: this.runCount,
      failureCount: this.failureCount,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Manually trigger a test run (outside of schedule)
   */
  async triggerTestRun(): Promise<any> {
    if (!this.isScheduled) {
      throw new Error("Scheduler is not running. Start the scheduler first.");
    }

    logger.info("Manual test run triggered");

    try {
      const result = await this.executeDailyJob();
      logger.info("Manual test run completed successfully");
      return result;
    } catch (error) {
      logger.error("Manual test run failed", error);
      throw error;
    }
  }

  /**
   * Update the schedule time (requires restart)
   */
  updateSchedule(newTime: string): void {
    if (!this.isValidCronExpression(newTime)) {
      throw new Error("Invalid cron expression provided");
    }

    logger.info(`Updating cron schedule from current to: ${newTime}`);

    // Stop current schedule
    this.stop();

    // Update config (this would need to be persisted in a real system)
    (scrapingConfig as any).scheduleTime = newTime;

    // Restart with new schedule
    this.start();
  }

  /**
   * Validate cron expression
   */
  private isValidCronExpression(expression: string): boolean {
    try {
      return cron.validate(expression);
    } catch {
      return false;
    }
  }

  /**
   * Get time until next run
   */
  getTimeUntilNextRun(): number | null {
    if (!this.nextRunTime) return null;
    return this.nextRunTime.getTime() - Date.now();
  }

  /**
   * Get formatted time until next run
   */
  getFormattedTimeUntilNextRun(): string {
    const timeUntil = this.getTimeUntilNextRun();
    if (!timeUntil) return "Not scheduled";

    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

// Export singleton instance
export const cronScheduler = new CronScheduler();
