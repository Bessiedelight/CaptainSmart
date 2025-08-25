import { gsap } from "gsap";

/**
 * Animation utilities for smooth UI interactions using GSAP
 */

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  onComplete?: () => void;
  onStart?: () => void;
}

/**
 * Common animation presets
 */
export const AnimationPresets = {
  // Entrance animations
  fadeInUp: {
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
  },
  fadeInDown: {
    from: { opacity: 0, y: -30 },
    to: { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
  },
  fadeInScale: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" },
  },
  slideInLeft: {
    from: { opacity: 0, x: -50 },
    to: { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
  },
  slideInRight: {
    from: { opacity: 0, x: 50 },
    to: { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" },
  },

  // Exit animations
  fadeOutUp: {
    to: { opacity: 0, y: -30, duration: 0.3, ease: "power2.in" },
  },
  fadeOutDown: {
    to: { opacity: 0, y: 30, duration: 0.3, ease: "power2.in" },
  },
  fadeOutScale: {
    to: { opacity: 0, scale: 0.8, duration: 0.3, ease: "power2.in" },
  },

  // Interaction animations
  bounce: {
    to: {
      scale: 1.1,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
  },
  pulse: {
    to: {
      scale: 1.05,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
  },
  shake: {
    to: { x: -5, duration: 0.1, yoyo: true, repeat: 3, ease: "power2.out" },
  },
  glow: {
    to: {
      boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
      duration: 0.3,
      yoyo: true,
      repeat: 1,
    },
  },

  // Loading animations
  shimmer: {
    to: {
      backgroundPosition: "200% 0",
      duration: 1.5,
      repeat: -1,
      ease: "none",
    },
  },
  spin: {
    to: { rotation: 360, duration: 1, repeat: -1, ease: "none" },
  },
};

/**
 * Animation utility class for common UI animations
 */
export class UIAnimations {
  /**
   * Animate element entrance with stagger support
   */
  static animateIn(
    elements: Element | Element[] | NodeList | string,
    preset: keyof typeof AnimationPresets = "fadeInUp",
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const { duration, delay = 0, stagger = 0.1, onComplete, onStart } = options;
    const animation = AnimationPresets[preset];

    const tl = gsap.timeline({
      onStart,
      onComplete,
    });

    if (animation.from) {
      tl.fromTo(elements, animation.from, {
        ...animation.to,
        duration: duration || animation.to.duration,
        delay,
        stagger,
      });
    } else {
      tl.to(elements, {
        ...animation.to,
        duration: duration || animation.to.duration,
        delay,
        stagger,
      });
    }

    return tl;
  }

  /**
   * Animate element exit
   */
  static animateOut(
    elements: Element | Element[] | NodeList | string,
    preset: keyof typeof AnimationPresets = "fadeOutUp",
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const {
      duration,
      delay = 0,
      stagger = 0.05,
      onComplete,
      onStart,
    } = options;
    const animation = AnimationPresets[preset];

    const tl = gsap.timeline({
      onStart,
      onComplete,
    });

    tl.to(elements, {
      ...animation.to,
      duration: duration || animation.to.duration,
      delay,
      stagger,
    });

    return tl;
  }

  /**
   * Animate button interactions
   */
  static animateButton(
    button: Element | string,
    type: "click" | "hover" | "success" | "error" = "click",
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const tl = gsap.timeline();

    switch (type) {
      case "click":
        tl.to(button, {
          scale: 0.95,
          duration: 0.1,
          ease: "power2.out",
        }).to(button, {
          scale: 1,
          duration: 0.1,
          ease: "power2.out",
        });
        break;

      case "hover":
        tl.to(button, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out",
        });
        break;

      case "success":
        tl.to(button, {
          scale: 1.1,
          backgroundColor: "#10b981",
          duration: 0.2,
          ease: "power2.out",
        }).to(button, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
        });
        break;

      case "error":
        tl.to(button, {
          x: -5,
          backgroundColor: "#ef4444",
          duration: 0.1,
          yoyo: true,
          repeat: 3,
          ease: "power2.out",
        }).to(button, {
          x: 0,
          duration: 0.1,
        });
        break;
    }

    if (options.onComplete) {
      tl.call(options.onComplete);
    }

    return tl;
  }

  /**
   * Animate metrics updates with number counting
   */
  static animateMetricsUpdate(
    element: Element | string,
    fromValue: number,
    toValue: number,
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const { duration = 0.5, onComplete } = options;
    const tl = gsap.timeline();

    // Scale animation for visual feedback
    tl.to(element, {
      scale: 1.1,
      duration: 0.1,
      ease: "power2.out",
    });

    // Number counting animation
    const obj = { value: fromValue };
    tl.to(
      obj,
      {
        value: toValue,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          const el =
            typeof element === "string"
              ? document.querySelector(element)
              : element;
          if (el) {
            el.textContent = Math.round(obj.value).toString();
          }
        },
      },
      0.05
    );

    // Scale back to normal
    tl.to(
      element,
      {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
        onComplete,
      },
      0.1
    );

    return tl;
  }

  /**
   * Animate comment submission with optimistic UI
   */
  static animateCommentSubmission(
    form: Element | string,
    commentContainer: Element | string,
    newComment: Element,
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const { onComplete } = options;
    const tl = gsap.timeline();

    // Animate form submission
    tl.to(form, {
      scale: 0.98,
      duration: 0.1,
      ease: "power2.out",
    }).to(form, {
      scale: 1,
      duration: 0.1,
      ease: "power2.out",
    });

    // Animate new comment appearance
    tl.fromTo(
      newComment,
      {
        opacity: 0,
        y: -20,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
      },
      0.2
    );

    // Animate container adjustment
    tl.to(
      commentContainer,
      {
        height: "auto",
        duration: 0.3,
        ease: "power2.out",
        onComplete,
      },
      0.2
    );

    return tl;
  }

  /**
   * Animate loading states with skeleton shimmer
   */
  static animateLoadingSkeleton(
    skeletons: Element | Element[] | NodeList | string,
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const tl = gsap.timeline({ repeat: -1 });

    // Entrance animation
    tl.fromTo(
      skeletons,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
      }
    );

    // Shimmer effect
    const shimmerElements =
      typeof skeletons === "string"
        ? document.querySelectorAll(`${skeletons} .shimmer-gradient`)
        : Array.from(skeletons as any).flatMap((el) =>
            Array.from(el.querySelectorAll(".shimmer-gradient"))
          );

    if (shimmerElements.length > 0) {
      tl.to(
        shimmerElements,
        {
          backgroundPosition: "200% 0",
          duration: 1.5,
          repeat: -1,
          ease: "none",
        },
        0.5
      );
    }

    return tl;
  }

  /**
   * Animate page transitions
   */
  static animatePageTransition(
    exitElements: Element | Element[] | NodeList | string,
    enterElements: Element | Element[] | NodeList | string,
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const { duration = 0.5, onComplete } = options;
    const tl = gsap.timeline();

    // Exit animation
    tl.to(exitElements, {
      opacity: 0,
      y: -30,
      duration: duration / 2,
      ease: "power2.in",
      stagger: 0.05,
    });

    // Enter animation
    tl.fromTo(
      enterElements,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: duration / 2,
        ease: "power2.out",
        stagger: 0.05,
        onComplete,
      }
    );

    return tl;
  }

  /**
   * Animate error states with attention-grabbing effects
   */
  static animateError(
    element: Element | string,
    message?: string,
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const { duration = 0.5, onComplete } = options;
    const tl = gsap.timeline();

    // Shake animation
    tl.to(element, {
      x: -10,
      duration: 0.1,
      yoyo: true,
      repeat: 3,
      ease: "power2.out",
    });

    // Color flash
    tl.to(
      element,
      {
        backgroundColor: "#fef2f2",
        borderColor: "#ef4444",
        duration: 0.2,
        ease: "power2.out",
      },
      0
    );

    // Reset colors
    tl.to(element, {
      backgroundColor: "transparent",
      borderColor: "#d1d5db",
      duration: 0.3,
      ease: "power2.out",
      onComplete,
    });

    // If message provided, animate it in
    if (message) {
      const messageEl = document.createElement("div");
      messageEl.className = "text-red-500 text-sm mt-1";
      messageEl.textContent = message;

      const parent =
        typeof element === "string" ? document.querySelector(element) : element;
      if (parent) {
        parent.appendChild(messageEl);

        tl.fromTo(
          messageEl,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
          0.2
        );

        // Auto-remove message after 3 seconds
        tl.to(messageEl, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: "power2.in",
          delay: 3,
          onComplete: () => messageEl.remove(),
        });
      }
    }

    return tl;
  }

  /**
   * Animate success states with positive feedback
   */
  static animateSuccess(
    element: Element | string,
    message?: string,
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    const { duration = 0.5, onComplete } = options;
    const tl = gsap.timeline();

    // Scale bounce
    tl.to(element, {
      scale: 1.05,
      duration: 0.2,
      ease: "back.out(1.7)",
    }).to(element, {
      scale: 1,
      duration: 0.2,
      ease: "power2.out",
    });

    // Color flash
    tl.to(
      element,
      {
        backgroundColor: "#f0fdf4",
        borderColor: "#10b981",
        duration: 0.2,
        ease: "power2.out",
      },
      0
    );

    // Reset colors
    tl.to(element, {
      backgroundColor: "transparent",
      borderColor: "#d1d5db",
      duration: 0.3,
      ease: "power2.out",
      onComplete,
    });

    // If message provided, animate it in
    if (message) {
      const messageEl = document.createElement("div");
      messageEl.className = "text-green-500 text-sm mt-1";
      messageEl.textContent = message;

      const parent =
        typeof element === "string" ? document.querySelector(element) : element;
      if (parent) {
        parent.appendChild(messageEl);

        tl.fromTo(
          messageEl,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
          0.2
        );

        // Auto-remove message after 3 seconds
        tl.to(messageEl, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: "power2.in",
          delay: 3,
          onComplete: () => messageEl.remove(),
        });
      }
    }

    return tl;
  }

  /**
   * Create a master timeline for complex animations
   */
  static createMasterTimeline(
    options: AnimationOptions = {}
  ): gsap.core.Timeline {
    return gsap.timeline({
      onStart: options.onStart,
      onComplete: options.onComplete,
    });
  }

  /**
   * Pause all animations
   */
  static pauseAll(): void {
    gsap.globalTimeline.pause();
  }

  /**
   * Resume all animations
   */
  static resumeAll(): void {
    gsap.globalTimeline.resume();
  }

  /**
   * Kill all animations
   */
  static killAll(): void {
    gsap.killTweensOf("*");
  }
}

/**
 * Hook for using animations in React components
 */
export function useAnimations() {
  return {
    animateIn: UIAnimations.animateIn,
    animateOut: UIAnimations.animateOut,
    animateButton: UIAnimations.animateButton,
    animateMetrics: UIAnimations.animateMetricsUpdate,
    animateComment: UIAnimations.animateCommentSubmission,
    animateError: UIAnimations.animateError,
    animateSuccess: UIAnimations.animateSuccess,
    createTimeline: UIAnimations.createMasterTimeline,
  };
}

/**
 * Performance monitoring for animations
 */
export class AnimationPerformance {
  private static metrics: Map<string, number[]> = new Map();

  static startMeasure(name: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    try {
      if (typeof performance !== "undefined" && performance.mark) {
        performance.mark(`${name}-start`);
      }
    } catch (error) {
      // Silently fail if performance API is not available
      console.warn("Performance API not available for measurement:", name);
    }
  }

  static endMeasure(name: string): number {
    try {
      if (typeof performance === "undefined" || !performance.mark) {
        return 0;
      }

      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measure = performance.getEntriesByName(name, "measure")[0];
      const duration = measure ? measure.duration : 0;

      const metrics = this.metrics.get(name) || [];
      metrics.push(duration);
      this.metrics.set(name, metrics);

      // Clean up performance entries
      if (performance.clearMarks && performance.clearMeasures) {
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      }

      return duration;
    } catch (error) {
      // Silently fail if performance API is not available
      console.warn("Performance API not available for measurement:", name);
      return 0;
    }
  }

  static getAverageTime(name: string): number {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((a, b) => a + b, 0);
    return sum / metrics.length;
  }

  static getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    for (const [name, times] of this.metrics.entries()) {
      result[name] = {
        average:
          times.length > 0
            ? times.reduce((a, b) => a + b, 0) / times.length
            : 0,
        count: times.length,
      };
    }

    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}
