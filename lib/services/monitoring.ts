import { logger } from "../utils/logger";
import { errorHandler } from "../utils/error-handler";
import { articleStorage } from "./article-storage";

export interface SystemMetrics {
  timestamp: Date;
  pipeline: {
    isRunning: boolean;
    lastRunTime: Date | null;
    successfulRuns: number;
    failedRuns: number;
    averageRunTime: number;
  };
  articles: {
    totalArticles: number;
    articlesPerCategory: Record<string, number>;
    freshArticles: number; // Articles from last 24 hours
    averageProcessingTime: number;
  };
  errors: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorRate: number; // Errors per hour
    isErrorRateHigh: boolean;
  };
  performance: {
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
  };
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: SystemMetrics[] = [];
  private maxMetricsHistory = 100;
  private pipelineRuns: Array<{
    startTime: Date;
    endTime: Date;
    success: boolean;
  }> = [];

  private constructor() {
    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every 5 minutes
    setInterval(
      () => {
        this.collectMetrics();
      },
      5 * 60 * 1000
    );

    // Initial collection
    this.collectMetrics();
  }

  /**
   * Collect current system metrics
   */
  collectMetrics(): SystemMetrics {
    const timestamp = new Date();

    // Get pipeline metrics
    const pipelineMetrics = this.getPipelineMetrics();

    // Get article metrics
    const articleMetrics = this.getArticleMetrics();

    // Get error metrics
    const errorMetrics = this.getErrorMetrics();

    // Get performance metrics
    const performanceMetrics = this.getPerformanceMetrics();

    const metrics: SystemMetrics = {
      timestamp,
      pipeline: pipelineMetrics,
      articles: articleMetrics,
      errors: errorMetrics,
      performance: performanceMetrics,
    };

    // Store metrics
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    logger.info("System metrics collected", {
      totalArticles: metrics.articles.totalArticles,
      errorRate: metrics.errors.errorRate,
      memoryUsage: metrics.performance.memoryUsage.percentage,
    });

    return metrics;
  }

  /**
   * Get pipeline-related metrics
   */
  private getPipelineMetrics(): SystemMetrics["pipeline"] {
    const successfulRuns = this.pipelineRuns.filter(
      (run) => run.success
    ).length;
    const failedRuns = this.pipelineRuns.filter((run) => !run.success).length;

    const runTimes = this.pipelineRuns.map(
      (run) => run.endTime.getTime() - run.startTime.getTime()
    );
    const averageRunTime =
      runTimes.length > 0
        ? runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length
        : 0;

    const lastRun =
      this.pipelineRuns.length > 0
        ? this.pipelineRuns[this.pipelineRuns.length - 1]
        : null;

    return {
      isRunning: false, // This would be determined by checking the orchestrator
      lastRunTime: lastRun?.endTime || null,
      successfulRuns,
      failedRuns,
      averageRunTime,
    };
  }

  /**
   * Get article-related metrics
   */
  private getArticleMetrics(): SystemMetrics["articles"] {
    const stats = articleStorage.getStorageStats();

    // Count fresh articles (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allArticles = articleStorage.getAllArticles();
    const freshArticles = allArticles.filter(
      (article) =>
        new Date(article.metadata.scrapingTimestamp) > twentyFourHoursAgo
    ).length;

    // Calculate average processing time
    const processingTimes = allArticles.map(
      (article) =>
        article.aiProcessingMetadata.processingTimestamp.getTime() -
        article.metadata.scrapingTimestamp.getTime()
    );
    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0;

    return {
      totalArticles: stats.totalArticles,
      articlesPerCategory: stats.categoryCounts,
      freshArticles,
      averageProcessingTime,
    };
  }

  /**
   * Get error-related metrics
   */
  private getErrorMetrics(): SystemMetrics["errors"] {
    const errorStats = errorHandler.getErrorStats();

    return {
      totalErrors: errorStats.totalErrors,
      errorsByType: errorStats.errorsByType,
      errorRate: errorStats.errorRate,
      isErrorRateHigh: errorHandler.isErrorRateHigh(),
    };
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): SystemMetrics["performance"] {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    return {
      memoryUsage: {
        used: usedMemory,
        total: totalMemory,
        percentage: Math.round(memoryPercentage * 100) / 100,
      },
      uptime: process.uptime(),
    };
  }

  /**
   * Record a pipeline run
   */
  recordPipelineRun(startTime: Date, endTime: Date, success: boolean): void {
    this.pipelineRuns.push({ startTime, endTime, success });

    // Keep only last 50 runs
    if (this.pipelineRuns.length > 50) {
      this.pipelineRuns.shift();
    }

    logger.info("Pipeline run recorded", {
      duration: endTime.getTime() - startTime.getTime(),
      success,
    });
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    metrics: SystemMetrics;
  } {
    const currentMetrics = this.collectMetrics();
    const issues: string[] = [];
    let status: "healthy" | "warning" | "critical" = "healthy";

    // Check error rate
    if (currentMetrics.errors.isErrorRateHigh) {
      issues.push("High error rate detected");
      status = "warning";
    }

    // Check memory usage
    if (currentMetrics.performance.memoryUsage.percentage > 90) {
      issues.push("High memory usage");
      status = "critical";
    } else if (currentMetrics.performance.memoryUsage.percentage > 75) {
      issues.push("Elevated memory usage");
      if (status === "healthy") status = "warning";
    }

    // Check article freshness
    if (
      currentMetrics.articles.freshArticles === 0 &&
      currentMetrics.articles.totalArticles > 0
    ) {
      issues.push("No fresh articles in last 24 hours");
      if (status === "healthy") status = "warning";
    }

    // Check pipeline failures
    const recentFailures = this.pipelineRuns
      .slice(-5) // Last 5 runs
      .filter((run) => !run.success).length;

    if (recentFailures >= 3) {
      issues.push("Multiple recent pipeline failures");
      status = "critical";
    } else if (recentFailures >= 2) {
      issues.push("Recent pipeline failures detected");
      if (status === "healthy") status = "warning";
    }

    return {
      status,
      issues,
      metrics: currentMetrics,
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 20): SystemMetrics[] {
    return this.metrics
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(): {
    articleGrowth: number; // Articles per hour
    errorTrend: number; // Error rate change
    memoryTrend: number; // Memory usage change
  } {
    if (this.metrics.length < 2) {
      return { articleGrowth: 0, errorTrend: 0, memoryTrend: 0 };
    }

    const latest = this.metrics[this.metrics.length - 1];
    const previous = this.metrics[this.metrics.length - 2];

    const timeDiff =
      (latest.timestamp.getTime() - previous.timestamp.getTime()) /
      (1000 * 60 * 60); // Hours

    const articleGrowth =
      timeDiff > 0
        ? (latest.articles.totalArticles - previous.articles.totalArticles) /
          timeDiff
        : 0;

    const errorTrend = latest.errors.errorRate - previous.errors.errorRate;
    const memoryTrend =
      latest.performance.memoryUsage.percentage -
      previous.performance.memoryUsage.percentage;

    return {
      articleGrowth: Math.round(articleGrowth * 100) / 100,
      errorTrend: Math.round(errorTrend * 100) / 100,
      memoryTrend: Math.round(memoryTrend * 100) / 100,
    };
  }

  /**
   * Generate monitoring report
   */
  generateReport(): {
    summary: string;
    health: ReturnType<MonitoringService["getHealthStatus"]>;
    trends: ReturnType<MonitoringService["getPerformanceTrends"]>;
    recentErrors: any[];
  } {
    const health = this.getHealthStatus();
    const trends = this.getPerformanceTrends();
    const recentErrors = errorHandler.getRecentErrors(5);

    const summary = `System Status: ${health.status.toUpperCase()}
Total Articles: ${health.metrics.articles.totalArticles}
Fresh Articles (24h): ${health.metrics.articles.freshArticles}
Error Rate: ${health.metrics.errors.errorRate}/hour
Memory Usage: ${health.metrics.performance.memoryUsage.percentage}%
${health.issues.length > 0 ? `Issues: ${health.issues.join(", ")}` : "No issues detected"}`;

    return {
      summary,
      health,
      trends,
      recentErrors,
    };
  }

  /**
   * Alert if critical issues detected
   */
  checkAlerts(): string[] {
    const health = this.getHealthStatus();
    const alerts: string[] = [];

    if (health.status === "critical") {
      alerts.push(`CRITICAL: ${health.issues.join(", ")}`);
    }

    // Check for specific alert conditions
    if (health.metrics.errors.errorRate > 20) {
      alerts.push(
        `HIGH ERROR RATE: ${health.metrics.errors.errorRate} errors/hour`
      );
    }

    if (health.metrics.performance.memoryUsage.percentage > 95) {
      alerts.push(
        `MEMORY CRITICAL: ${health.metrics.performance.memoryUsage.percentage}% usage`
      );
    }

    return alerts;
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();
