import { ErrorHandler } from "../error-handler";
import { ErrorType } from "../../types/scraping";

// Mock logger
jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("ErrorHandler", () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    errorHandler.clearStats();
  });

  describe("createError", () => {
    it("should create a scraping error with correct properties", () => {
      const error = errorHandler.createError(
        ErrorType.NETWORK_ERROR,
        "Connection failed",
        "https://example.com",
        { statusCode: 500 }
      );

      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.message).toBe("Connection failed");
      expect(error.url).toBe("https://example.com");
      expect(error.retryable).toBe(true);
      expect(error.context).toEqual({ statusCode: 500 });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should mark network errors as retryable", () => {
      const error = errorHandler.createError(
        ErrorType.NETWORK_ERROR,
        "Network issue"
      );
      expect(error.retryable).toBe(true);
    });

    it("should mark parsing errors as non-retryable", () => {
      const error = errorHandler.createError(
        ErrorType.PARSING_ERROR,
        "Parse failed"
      );
      expect(error.retryable).toBe(false);
    });

    it("should mark validation errors as non-retryable", () => {
      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        "Invalid data"
      );
      expect(error.retryable).toBe(false);
    });

    it("should mark AI processing errors as retryable", () => {
      const error = errorHandler.createError(
        ErrorType.AI_PROCESSING_ERROR,
        "AI failed"
      );
      expect(error.retryable).toBe(true);
    });
  });

  describe("handleError", () => {
    it("should handle network errors with retry logic", async () => {
      const error = errorHandler.createError(
        ErrorType.NETWORK_ERROR,
        "Connection timeout",
        "https://example.com"
      );

      await expect(errorHandler.handleError(error)).resolves.not.toThrow();
    });

    it("should handle parsing errors without retry", async () => {
      const error = errorHandler.createError(
        ErrorType.PARSING_ERROR,
        "Invalid HTML structure"
      );

      await expect(errorHandler.handleError(error)).resolves.not.toThrow();
    });

    it("should handle AI processing errors with retry logic", async () => {
      const error = errorHandler.createError(
        ErrorType.AI_PROCESSING_ERROR,
        "AI service unavailable"
      );

      await expect(errorHandler.handleError(error)).resolves.not.toThrow();
    });

    it("should handle validation errors without retry", async () => {
      const error = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        "Article too short"
      );

      await expect(errorHandler.handleError(error)).resolves.not.toThrow();
    });
  });

  describe("getErrorStats", () => {
    it("should return correct error statistics", () => {
      // Create some errors
      errorHandler.createError(ErrorType.NETWORK_ERROR, "Error 1");
      errorHandler.createError(ErrorType.NETWORK_ERROR, "Error 2");
      errorHandler.createError(ErrorType.PARSING_ERROR, "Error 3");

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ErrorType.NETWORK_ERROR]).toBe(2);
      expect(stats.errorsByType[ErrorType.PARSING_ERROR]).toBe(1);
      expect(stats.recentErrorsCount).toBe(3);
    });

    it("should calculate error rate correctly", () => {
      // Create errors
      errorHandler.createError(ErrorType.NETWORK_ERROR, "Recent error");

      const stats = errorHandler.getErrorStats();
      expect(stats.errorRate).toBeGreaterThan(0);
    });
  });

  describe("getRecentErrors", () => {
    it("should return recent errors in reverse chronological order", () => {
      const error1 = errorHandler.createError(
        ErrorType.NETWORK_ERROR,
        "First error"
      );
      const error2 = errorHandler.createError(
        ErrorType.PARSING_ERROR,
        "Second error"
      );
      const error3 = errorHandler.createError(
        ErrorType.VALIDATION_ERROR,
        "Third error"
      );

      const recentErrors = errorHandler.getRecentErrors(2);

      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].message).toBe("Third error");
      expect(recentErrors[1].message).toBe("Second error");
    });

    it("should respect the limit parameter", () => {
      for (let i = 0; i < 5; i++) {
        errorHandler.createError(ErrorType.NETWORK_ERROR, `Error ${i}`);
      }

      const recentErrors = errorHandler.getRecentErrors(3);
      expect(recentErrors).toHaveLength(3);
    });
  });

  describe("isErrorRateHigh", () => {
    it("should return false when error rate is below threshold", () => {
      errorHandler.createError(ErrorType.NETWORK_ERROR, "Single error");
      expect(errorHandler.isErrorRateHigh(10)).toBe(false);
    });

    it("should return true when error rate exceeds threshold", () => {
      // Create many errors to exceed threshold
      for (let i = 0; i < 15; i++) {
        errorHandler.createError(ErrorType.NETWORK_ERROR, `Error ${i}`);
      }
      expect(errorHandler.isErrorRateHigh(10)).toBe(true);
    });
  });

  describe("fromException", () => {
    it("should create error from Error object", () => {
      const exception = new Error("Test error");
      const error = ErrorHandler.fromException(
        exception,
        ErrorType.PARSING_ERROR,
        "https://test.com"
      );

      expect(error.type).toBe(ErrorType.PARSING_ERROR);
      expect(error.message).toBe("Test error");
      expect(error.url).toBe("https://test.com");
      expect(error.context?.stack).toBeDefined();
    });

    it("should create error from string", () => {
      const error = ErrorHandler.fromException(
        "String error",
        ErrorType.NETWORK_ERROR
      );

      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.message).toBe("String error");
    });

    it("should handle unknown exception types", () => {
      const error = ErrorHandler.fromException({ unknown: "object" });

      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.message).toBe("Unknown error occurred");
    });
  });

  describe("withErrorHandling", () => {
    it("should return result when function succeeds", async () => {
      const successFn = async () => "success";
      const result = await ErrorHandler.withErrorHandling(successFn);

      expect(result).toBe("success");
    });

    it("should return null when function throws", async () => {
      const failFn = async () => {
        throw new Error("Function failed");
      };

      const result = await ErrorHandler.withErrorHandling(
        failFn,
        ErrorType.PARSING_ERROR
      );

      expect(result).toBeNull();
    });

    it("should handle and log errors properly", async () => {
      const failFn = async () => {
        throw new Error("Test failure");
      };

      await ErrorHandler.withErrorHandling(
        failFn,
        ErrorType.AI_PROCESSING_ERROR,
        "https://test.com"
      );

      const stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorsByType[ErrorType.AI_PROCESSING_ERROR]).toBe(1);
    });
  });

  describe("clearStats", () => {
    it("should clear all error statistics", () => {
      // Create some errors
      errorHandler.createError(ErrorType.NETWORK_ERROR, "Error 1");
      errorHandler.createError(ErrorType.PARSING_ERROR, "Error 2");

      let stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(2);

      errorHandler.clearStats();

      stats = errorHandler.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.recentErrorsCount).toBe(0);
    });
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
