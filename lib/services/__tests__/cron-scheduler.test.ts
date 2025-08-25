import { describe, beforeEach, afterEach, it } from "node:test";
import { CronScheduler } from "../cron-scheduler";

// Mock node-cron
const mockSchedule = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockDestroy = jest.fn();
const mockValidate = jest.fn();

const mockScheduledTask = {
  start: mockStart,
  stop: mockStop,
  destroy: mockDestroy,
};

jest.mock("node-cron", () => ({
  schedule: mockSchedule,
  validate: mockValidate,
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the API route import
jest.mock("../../../app/api/scraping/trigger/route", () => ({
  POST: jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({
      success: true,
      data: {
        result: {
          totalArticlesProcessed: 5,
          successfulArticles: 5,
          failedArticles: 0,
          errors: [],
        },
      },
    }),
  }),
}));

describe("CronScheduler", () => {
  let scheduler: CronScheduler;

  beforeEach(() => {
    scheduler = new CronScheduler();
    mockSchedule.mockReturnValue(mockScheduledTask);
    mockValidate.mockReturnValue(true);
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any running schedulers
    try {
      scheduler.stop();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("start", () => {
    it("should start the cron scheduler successfully", () => {
      scheduler.start();

      expect(mockSchedule).toHaveBeenCalledWith(
        "0 6 * * *", // 6 AM daily
        expect.any(Function),
        {
          scheduled: false,
          timezone: "UTC",
        }
      );
      expect(mockStart).toHaveBeenCalled();

      const status = scheduler.getStatus();
      expect(status.isScheduled).toBe(true);
      expect(status.nextRunTime).toBeInstanceOf(Date);
    });

    it("should not start if already scheduled", () => {
      scheduler.start();
      scheduler.start(); // Try to start again

      expect(mockSchedule).toHaveBeenCalledTimes(1);
    });

    it("should handle start errors gracefully", () => {
      mockSchedule.mockImplementation(() => {
        throw new Error("Schedule failed");
      });

      expect(() => scheduler.start()).toThrow("Schedule failed");
    });
  });

  describe("stop", () => {
    it("should stop the scheduler successfully", () => {
      scheduler.start();
      scheduler.stop();

      expect(mockStop).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();

      const status = scheduler.getStatus();
      expect(status.isScheduled).toBe(false);
      expect(status.nextRunTime).toBeNull();
    });

    it("should handle stop when not running", () => {
      scheduler.stop(); // Stop without starting

      expect(mockStop).not.toHaveBeenCalled();
      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  describe("getStatus", () => {
    it("should return correct status when not scheduled", () => {
      const status = scheduler.getStatus();

      expect(status).toEqual({
        isScheduled: false,
        lastRunTime: null,
        nextRunTime: null,
        runCount: 0,
        failureCount: 0,
        successRate: 0,
      });
    });

    it("should return correct status when scheduled", () => {
      scheduler.start();
      const status = scheduler.getStatus();

      expect(status.isScheduled).toBe(true);
      expect(status.nextRunTime).toBeInstanceOf(Date);
      expect(status.runCount).toBe(0);
      expect(status.failureCount).toBe(0);
      expect(status.successRate).toBe(0);
    });
  });

  describe("triggerTestRun", () => {
    it("should execute test run when scheduler is running", async () => {
      scheduler.start();

      await expect(scheduler.triggerTestRun()).resolves.not.toThrow();

      const status = scheduler.getStatus();
      expect(status.runCount).toBe(1);
      expect(status.failureCount).toBe(0);
    });

    it("should throw error when scheduler is not running", async () => {
      await expect(scheduler.triggerTestRun()).rejects.toThrow(
        "Scheduler is not running. Start the scheduler first."
      );
    });
  });

  describe("updateSchedule", () => {
    it("should update schedule with valid cron expression", () => {
      const newExpression = "0 8 * * *"; // 8 AM
      mockValidate.mockReturnValue(true);

      scheduler.start();
      scheduler.updateSchedule(newExpression);

      // Should have stopped and restarted
      expect(mockStop).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockSchedule).toHaveBeenCalledTimes(2); // Once for start, once for update
    });

    it("should reject invalid cron expression", () => {
      const invalidExpression = "invalid cron";
      mockValidate.mockReturnValue(false);

      expect(() => scheduler.updateSchedule(invalidExpression)).toThrow(
        "Invalid cron expression provided"
      );
    });
  });

  describe("time calculations", () => {
    beforeEach(() => {
      // Mock current time to 5 AM (before 6 AM schedule)
      jest.useFakeTimers();
      const mockDate = new Date("2025-01-26T05:00:00.000Z");
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should calculate next run time correctly when before 6 AM", () => {
      scheduler.start();
      const status = scheduler.getStatus();

      expect(status.nextRunTime).not.toBeNull();
      expect(status.nextRunTime!.getHours()).toBe(6);
      expect(status.nextRunTime!.getMinutes()).toBe(0);
    });

    it("should calculate time until next run", () => {
      scheduler.start();
      const timeUntil = scheduler.getTimeUntilNextRun();

      expect(timeUntil).toBeGreaterThan(0);
      expect(timeUntil).toBeLessThanOrEqual(60 * 60 * 1000); // Less than 1 hour
    });

    it("should format time until next run correctly", () => {
      scheduler.start();
      const formatted = scheduler.getFormattedTimeUntilNextRun();

      expect(formatted).toMatch(/^\d+h \d+m$|^\d+m$/);
    });
  });

  describe("job execution", () => {
    it("should handle successful job execution", async () => {
      scheduler.start();

      // Get the scheduled function and call it directly
      const scheduledFunction = mockSchedule.mock.calls[0][1];
      await scheduledFunction();

      const status = scheduler.getStatus();
      expect(status.runCount).toBe(1);
      expect(status.failureCount).toBe(0);
      expect(status.successRate).toBe(100);
    });

    it("should handle failed job execution", async () => {
      // Mock API to fail
      const { POST } = require("../../../app/api/scraping/trigger/route");
      POST.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: false,
          error: "API failed",
        }),
      });

      scheduler.start();

      // Get the scheduled function and call it directly
      const scheduledFunction = mockSchedule.mock.calls[0][1];
      await scheduledFunction();

      const status = scheduler.getStatus();
      expect(status.runCount).toBe(1);
      expect(status.failureCount).toBe(1);
      expect(status.successRate).toBe(0);
    });
  });
});
