/**
 * Integration tests for real-time metrics functionality
 * Tests the complete flow of optimistic updates, API calls, and error recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRealTimeMetrics } from "@/lib/hooks/useRealTimeMetrics";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Real-time Metrics Integration", () => {
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
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Optimistic Updates", () => {
    it("should apply optimistic vote updates immediately", async () => {
      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Mock successful vote API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            upvotes: 11,
            downvotes: 2,
            netVotes: 9,
          },
        }),
      });

      // Initial state
      expect(result.current.metrics.upvotes).toBe(10);
      expect(result.current.metrics.netVotes).toBe(8);

      // Perform upvote
      await act(async () => {
        await result.current.updateVote("upvote");
      });

      // Should immediately show optimistic update
      expect(result.current.metrics.upvotes).toBe(11);
      expect(result.current.metrics.netVotes).toBe(9);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/expose/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exposeId: mockExposeId,
            voteType: "upvote",
          }),
          signal: expect.any(AbortSignal),
        });
      });
    });

    it("should apply optimistic comment updates immediately", async () => {
      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Mock successful comment refresh API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            exposes: [
              {
                exposeId: mockExposeId,
                commentCount: 6,
              },
            ],
          },
        }),
      });

      // Initial state
      expect(result.current.metrics.comments).toBe(5);

      // Add comment
      await act(async () => {
        await result.current.updateComment(1);
      });

      // Should immediately show optimistic update
      expect(result.current.metrics.comments).toBe(6);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/expose?exposeId=${mockExposeId}`,
          {
            signal: expect.any(AbortSignal),
          }
        );
      });
    });

    it("should apply optimistic view updates immediately", async () => {
      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Mock successful view API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          viewCount: 101,
        }),
      });

      // Initial state
      expect(result.current.metrics.views).toBe(100);

      // Track view
      await act(async () => {
        await result.current.updateView();
      });

      // Should immediately show optimistic update
      expect(result.current.metrics.views).toBe(101);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/expose/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exposeId: mockExposeId }),
          signal: expect.any(AbortSignal),
        });
      });
    });
  });

  describe("Error Recovery", () => {
    it("should retry failed vote updates with exponential backoff", async () => {
      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Mock failed API response, then success
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              upvotes: 11,
              downvotes: 2,
              netVotes: 9,
            },
          }),
        });

      // Perform upvote
      await act(async () => {
        await result.current.updateVote("upvote");
      });

      // Should show optimistic update immediately
      expect(result.current.metrics.upvotes).toBe(11);
      expect(result.current.hasOptimisticUpdates).toBe(true);

      // Fast-forward to trigger retry
      await act(async () => {
        vi.advanceTimersByTime(1000); // First retry after 1 second
      });

      // Wait for retry to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // Should eventually succeed and clear optimistic updates
      await waitFor(() => {
        expect(result.current.hasOptimisticUpdates).toBe(false);
      });
    });

    it("should revert optimistic updates after max retry attempts", async () => {
      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Mock all API calls to fail
      mockFetch.mockRejectedValue(new Error("Persistent network error"));

      // Perform upvote
      await act(async () => {
        await result.current.updateVote("upvote");
      });

      // Should show optimistic update initially
      expect(result.current.metrics.upvotes).toBe(11);
      expect(result.current.hasOptimisticUpdates).toBe(true);

      // Fast-forward through all retry attempts
      await act(async () => {
        vi.advanceTimersByTime(1000); // First retry
        vi.advanceTimersByTime(2000); // Second retry
        vi.advanceTimersByTime(4000); // Third retry
        vi.advanceTimersByTime(8000); // Max retries exceeded
      });

      // Should eventually revert to original state
      await waitFor(() => {
        expect(result.current.hasOptimisticUpdates).toBe(false);
      });

      // Should be back to original values
      expect(result.current.metrics.upvotes).toBe(10);
    });

    it("should handle concurrent updates gracefully", async () => {
      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { upvotes: 11, downvotes: 2, netVotes: 9 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { upvotes: 11, downvotes: 3, netVotes: 8 },
          }),
        });

      // Perform concurrent votes
      await act(async () => {
        const upvotePromise = result.current.updateVote("upvote");
        const downvotePromise = result.current.updateVote("downvote");
        await Promise.all([upvotePromise, downvotePromise]);
      });

      // Should handle both updates
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Wait for all updates to complete
      await waitFor(() => {
        expect(result.current.hasOptimisticUpdates).toBe(false);
      });
    });
  });

  describe("Metrics Persistence", () => {
    it("should refresh metrics from server periodically", async () => {
      const onMetricsChange = vi.fn();

      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
          onMetricsChange,
        })
      );

      // Mock refresh API response with updated metrics
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

      // Trigger refresh
      await act(async () => {
        await result.current.refreshMetrics();
      });

      // Should update metrics with server data
      expect(result.current.metrics.views).toBe(150);
      expect(result.current.metrics.comments).toBe(8);
      expect(result.current.metrics.upvotes).toBe(15);
      expect(result.current.metrics.shares).toBe(5);

      // Should notify parent of changes
      expect(onMetricsChange).toHaveBeenCalledWith({
        views: 150,
        comments: 8,
        upvotes: 15,
        downvotes: 3,
        netVotes: 12,
        shares: 5,
      });
    });

    it("should maintain metrics consistency after page refresh simulation", async () => {
      // Simulate initial load with server data
      const serverMetrics = {
        views: 200,
        comments: 10,
        upvotes: 20,
        downvotes: 5,
        netVotes: 15,
        shares: 8,
      };

      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics: serverMetrics,
        })
      );

      // Should start with server metrics
      expect(result.current.metrics).toEqual(serverMetrics);
      expect(result.current.hasOptimisticUpdates).toBe(false);
    });
  });

  describe("Share Functionality", () => {
    it("should handle share updates with optimistic UI", async () => {
      const { result } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Mock successful share API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            shareCount: 4,
          },
        }),
      });

      // Initial state
      expect(result.current.metrics.shares).toBe(3);

      // Perform share
      await act(async () => {
        await result.current.updateShare();
      });

      // Should immediately show optimistic update
      expect(result.current.metrics.shares).toBe(4);

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/expose/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exposeId: mockExposeId }),
          signal: expect.any(AbortSignal),
        });
      });
    });
  });

  describe("Cleanup and Memory Management", () => {
    it("should cleanup timeouts and abort controllers on unmount", async () => {
      const { result, unmount } = renderHook(() =>
        useRealTimeMetrics({
          exposeId: mockExposeId,
          initialMetrics,
        })
      );

      // Start an operation that would create timeouts/controllers
      mockFetch.mockRejectedValue(new Error("Network error"));

      await act(async () => {
        await result.current.updateVote("upvote");
      });

      // Should have optimistic updates
      expect(result.current.hasOptimisticUpdates).toBe(true);

      // Unmount component
      unmount();

      // Should not throw errors or cause memory leaks
      expect(() => {
        vi.advanceTimersByTime(10000);
      }).not.toThrow();
    });
  });
});
