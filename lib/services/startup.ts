import { cronScheduler } from "./cron-scheduler";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Initialize application services on startup
 */
export async function initializeServices(): Promise<void> {
  try {
    logger.info("Initializing application services...");

    // Validate environment variables
    try {
      env.validate();
      logger.info("Environment validation passed");
    } catch (error) {
      logger.error("Environment validation failed", error);
      // Don't throw in development, just warn
      if (env.isProduction) {
        throw error;
      }
    }

    // Start cron scheduler only in production or when explicitly enabled
    const enableCron =
      process.env.ENABLE_CRON_SCHEDULER === "true" || env.isProduction;

    if (enableCron) {
      logger.info("Starting cron scheduler for daily news scraping...");
      cronScheduler.start();

      const status = cronScheduler.getStatus();
      logger.info("Cron scheduler initialized successfully", {
        nextRun: status.nextRunTime?.toISOString(),
        timeUntilNext: cronScheduler.getFormattedTimeUntilNextRun(),
      });
    } else {
      logger.info("Cron scheduler disabled (development mode)");
      logger.info("To enable: set ENABLE_CRON_SCHEDULER=true in environment");
    }

    logger.info("Application services initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize application services", error);
    throw error;
  }
}

/**
 * Gracefully shutdown services
 */
export async function shutdownServices(): Promise<void> {
  try {
    logger.info("Shutting down application services...");

    // Stop cron scheduler
    if (cronScheduler.getStatus().isScheduled) {
      cronScheduler.stop();
      logger.info("Cron scheduler stopped");
    }

    logger.info("Application services shutdown completed");
  } catch (error) {
    logger.error("Error during service shutdown", error);
  }
}

// Handle process termination signals
if (typeof process !== "undefined") {
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully...");
    await shutdownServices();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down gracefully...");
    await shutdownServices();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
    shutdownServices().finally(() => {
      process.exit(1);
    });
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection at:", promise, "reason:", reason);
    shutdownServices().finally(() => {
      process.exit(1);
    });
  });
}
