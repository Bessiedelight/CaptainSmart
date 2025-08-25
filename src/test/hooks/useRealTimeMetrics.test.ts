/**
 * Unit tests for useRealTimeMetrics hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRealTimeMetrics } from "@/lib/hooks/useRealTimeMetrics";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useRealTimeMetrics", () => {
  const mockExposeId = "expose_test123";
  const initialMetrics = {
    views: 100,
    comments: 5,
    upvotes: 10,
    downvotes: 2,
    netVotes: 8,
    shares: 3,
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should initialize with provided metrics", () => {
    const { result } = renderHook(() =>
      useRealTimeMetrics({
        exposeId: mockExposeId,
        initialMetrics,
      })
    );

    expect(result.current.metrics).toEqual(initialMetrics);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.hasOptimisticUpdates).toBe(false);
  });

  it("should provide all required methods", () => {
    const { result } = renderHook(() =>
      useRealTimeMetrics({
        exposeId: mockExposeId,
        initialMetrics,
      })
    );

    expect(typeof result.current.updateVote).toBe("function");
    expect(typeof result.current.updateComment).toBe("function");
    expect(typeof result.current.updateView).toBe("function");
    expect(typeof result.current.updateShare).toBe("function");
    expect(typeof result.current.refreshMetrics).toBe("function");
  });

  it("should call onMetricsChange when metrics change", () => {
    const onMetricsChange = vi.fn();

    renderHook(() =>
      useRealTimeMetrics({
        exposeId: mockExposeId,
        initialMetrics,
        onMetricsChange,
      })
    );

    expect(onMetricsChange).toHaveBeenCalledWith(initialMetrics);
  });

  it("should handle refresh metrics successfully", async () => {
    const { result } = renderHook(() =>
      useRealTimeMetrics({
        exposeId: mockExposeId,
        initialMetrics,
      })
    );

    // Mock successful refresh response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          exposes: [
            {
              exposeId: mockExposeId,
              views: 150,
              commentCount: 8,
              upvotes: 15,
              downvotes: 3,
              netVotes: 12,
              shareCount: 5,
            },
          ],
        },
      }),
    });

    await act(async () => {
      await result.current.refreshMetrics();
    });

    expect(result.current.metrics.views).toBe(150);
    expect(result.current.metrics.comments).toBe(8);
    expect(result.current.metrics.upvotes).toBe(15);
    expect(result.current.metrics.shares).toBe(5);
  });

  it("should handle refresh metrics failure gracefully", async () => {
    const { result } = renderHook(() =>
      useRealTimeMetrics({
        exposeId: mockExposeId,
        initialMetrics,
      })
    );

    // Mock failed refresh response
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      await result.current.refreshMetrics();
    });

    // Should maintain original metrics on failure
    expect(result.current.metrics).toEqual(initialMetrics);
  });
});
