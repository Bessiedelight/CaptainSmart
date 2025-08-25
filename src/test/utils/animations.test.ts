import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  expect,
} from "vitest";

// Mock GSAP before importing the module
vi.mock("gsap", () => ({
  gsap: {
    timeline: vi.fn(() => ({
      fromTo: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
    })),
    fromTo: vi.fn(),
    to: vi.fn(),
    killTweensOf: vi.fn(),
    globalTimeline: {
      pause: vi.fn(),
      resume: vi.fn(),
    },
  },
}));

import { UIAnimations, AnimationPerformance } from "@/lib/utils/animations";

// Mock DOM elements
const mockElement = {
  textContent: "",
  appendChild: vi.fn(),
  remove: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
};

const mockDocument = {
  querySelector: vi.fn(() => mockElement),
  querySelectorAll: vi.fn(() => [mockElement]),
  createElement: vi.fn(() => mockElement),
};

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => [{ duration: 16.7 }]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

Object.defineProperty(global, "document", {
  value: mockDocument,
  writable: true,
});

Object.defineProperty(global, "performance", {
  value: mockPerformance,
  writable: true,
});

describe("UIAnimations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    AnimationPerformance.clearMetrics();
  });

  describe("animateIn", () => {
    it("should create timeline for animation", () => {
      const elements = [mockElement];

      const result = UIAnimations.animateIn(elements, "fadeInUp", {
        duration: 0.5,
        stagger: 0.1,
      });

      expect(result).toBeDefined();
    });

    it("should handle string selectors", () => {
      const result = UIAnimations.animateIn(".test-class", "fadeInScale");
      expect(result).toBeDefined();
    });

    it("should apply custom options", () => {
      const onComplete = vi.fn();

      const result = UIAnimations.animateIn(mockElement, "fadeInUp", {
        duration: 1.0,
        delay: 0.5,
        onComplete,
      });

      expect(result).toBeDefined();
    });
  });

  describe("animateOut", () => {
    it("should animate elements out", () => {
      const result = UIAnimations.animateOut(mockElement, "fadeOutUp", {
        duration: 0.3,
      });

      expect(result).toBeDefined();
    });
  });

  describe("animateButton", () => {
    it("should animate button click", () => {
      const result = UIAnimations.animateButton(mockElement, "click");
      expect(result).toBeDefined();
    });

    it("should animate button hover", () => {
      const result = UIAnimations.animateButton(mockElement, "hover");
      expect(result).toBeDefined();
    });

    it("should animate button success state", () => {
      const result = UIAnimations.animateButton(mockElement, "success");
      expect(result).toBeDefined();
    });

    it("should animate button error state", () => {
      const result = UIAnimations.animateButton(mockElement, "error");
      expect(result).toBeDefined();
    });
  });

  describe("animateMetricsUpdate", () => {
    it("should animate metrics with number counting", () => {
      const result = UIAnimations.animateMetricsUpdate(mockElement, 10, 15, {
        duration: 0.5,
      });

      expect(result).toBeDefined();
    });

    it("should handle string selectors for metrics", () => {
      const result = UIAnimations.animateMetricsUpdate(
        "#metric-element",
        0,
        100
      );
      expect(result).toBeDefined();
    });
  });

  describe("animateError", () => {
    it("should animate error state", () => {
      const result = UIAnimations.animateError(mockElement, "Error message");
      expect(result).toBeDefined();
    });

    it("should create error message element when message provided", () => {
      UIAnimations.animateError(mockElement, "Test error");
      expect(mockDocument.createElement).toHaveBeenCalledWith("div");
    });
  });

  describe("animateSuccess", () => {
    it("should animate success state", () => {
      const result = UIAnimations.animateSuccess(
        mockElement,
        "Success message"
      );
      expect(result).toBeDefined();
    });

    it("should create success message element when message provided", () => {
      UIAnimations.animateSuccess(mockElement, "Test success");
      expect(mockDocument.createElement).toHaveBeenCalledWith("div");
    });
  });
});

describe("AnimationPerformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AnimationPerformance.clearMetrics();
  });

  describe("performance measurement", () => {
    it("should start and end measurements", () => {
      AnimationPerformance.startMeasure("testAnimation");
      expect(mockPerformance.mark).toHaveBeenCalledWith("testAnimation-start");

      const duration = AnimationPerformance.endMeasure("testAnimation");
      expect(mockPerformance.mark).toHaveBeenCalledWith("testAnimation-end");
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        "testAnimation",
        "testAnimation-start",
        "testAnimation-end"
      );
      expect(typeof duration).toBe("number");
    });

    it("should calculate average times", () => {
      // Simulate multiple measurements
      AnimationPerformance.startMeasure("testAnimation");
      AnimationPerformance.endMeasure("testAnimation");

      AnimationPerformance.startMeasure("testAnimation");
      AnimationPerformance.endMeasure("testAnimation");

      const average = AnimationPerformance.getAverageTime("testAnimation");
      expect(typeof average).toBe("number");
      expect(average).toBeGreaterThanOrEqual(0);
    });

    it("should return 0 for non-existent measurements", () => {
      const average = AnimationPerformance.getAverageTime("nonExistent");
      expect(average).toBe(0);
    });

    it("should get all metrics", () => {
      AnimationPerformance.startMeasure("test1");
      AnimationPerformance.endMeasure("test1");

      AnimationPerformance.startMeasure("test2");
      AnimationPerformance.endMeasure("test2");

      const metrics = AnimationPerformance.getMetrics();
      expect(metrics).toHaveProperty("test1");
      expect(metrics).toHaveProperty("test2");
      expect(metrics.test1).toHaveProperty("average");
      expect(metrics.test1).toHaveProperty("count");
    });

    it("should clear all metrics", () => {
      AnimationPerformance.startMeasure("test");
      AnimationPerformance.endMeasure("test");

      let metrics = AnimationPerformance.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(1);

      AnimationPerformance.clearMetrics();
      metrics = AnimationPerformance.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });
});

describe("Error Handling", () => {
  it("should handle missing elements gracefully", () => {
    mockDocument.querySelector.mockReturnValueOnce(null);

    expect(() => {
      UIAnimations.animateIn(".non-existent", "fadeInUp");
    }).not.toThrow();
  });

  it("should handle performance API unavailability", () => {
    const originalPerformance = global.performance;
    // @ts-ignore
    global.performance = undefined;

    expect(() => {
      AnimationPerformance.startMeasure("test");
      AnimationPerformance.endMeasure("test");
    }).not.toThrow();

    global.performance = originalPerformance;
  });
});
