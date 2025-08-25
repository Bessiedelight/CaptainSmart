import { useState, useCallback, useRef, useEffect } from "react";

interface MetricsState {
  views: number;
  comments: number;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  shares: number;
}

interface OptimisticUpdate {
  id: string;
  type: "vote" | "comment" | "view" | "share";
  data: Partial<MetricsState>;
  timestamp: number;
  retryCount: number;
}

interface UseRealTimeMetricsProps {
  exposeId: string;
  initialMetrics: MetricsState;
  onMetricsChange?: (metrics: MetricsState) => void;
}

interface UseRealTimeMetricsReturn {
  metrics: MetricsState;
  isUpdating: boolean;
  updateVote: (voteType: "upvote" | "downvote") => Promise<boolean>;
  updateComment: (increment: number) => Promise<boolean>;
  updateView: () => Promise<boolean>;
  updateShare: () => Promise<boolean>;
  refreshMetrics: () => Promise<void>;
  hasOptimisticUpdates: boolean;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export function useRealTimeMetrics({
  exposeId,
  initialMetrics,
  onMetricsChange,
}: UseRealTimeMetricsProps): UseRealTimeMetricsReturn {
  const [metrics, setMetrics] = useState<MetricsState>(initialMetrics);
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    OptimisticUpdate[]
  >([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Cleanup function for timeouts and controllers
  const cleanup = useCallback(() => {
    retryTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    retryTimeouts.current.clear();
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Calculate current metrics including optimistic updates
  const getCurrentMetrics = useCallback((): MetricsState => {
    let currentMetrics = { ...metrics };

    optimisticUpdates.forEach((update) => {
      Object.entries(update.data).forEach(([key, value]) => {
        if (typeof value === "number") {
          currentMetrics[key as keyof MetricsState] = value;
        }
      });
    });

    return currentMetrics;
  }, [metrics, optimisticUpdates]);

  // Apply optimistic update
  const applyOptimisticUpdate = useCallback((update: OptimisticUpdate) => {
    setOptimisticUpdates((prev) => {
      // Remove any existing update with the same ID
      const filtered = prev.filter((u) => u.id !== update.id);
      return [...filtered, update];
    });
  }, []);

  // Remove optimistic update
  const removeOptimisticUpdate = useCallback((updateId: string) => {
    setOptimisticUpdates((prev) => prev.filter((u) => u.id !== updateId));
  }, []);

  // Retry failed update
  const retryUpdate = useCallback(
    async (update: OptimisticUpdate) => {
      if (update.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.warn(`Max retry attempts reached for update ${update.id}`);
        removeOptimisticUpdate(update.id);
        return false;
      }

      const delay = RETRY_DELAY * Math.pow(2, update.retryCount); // Exponential backoff

      const timeoutId = setTimeout(async () => {
        retryTimeouts.current.delete(update.id);

        const updatedUpdate = {
          ...update,
          retryCount: update.retryCount + 1,
        };

        let success = false;

        try {
          switch (update.type) {
            case "vote":
              success = await performVoteUpdate(updatedUpdate);
              break;
            case "comment":
              success = await performCommentUpdate(updatedUpdate);
              break;
            case "view":
              success = await performViewUpdate(updatedUpdate);
              break;
            case "share":
              success = await performShareUpdate(updatedUpdate);
              break;
          }
        } catch (error) {
          console.error(`Retry failed for update ${update.id}:`, error);
        }

        if (!success) {
          await retryUpdate(updatedUpdate);
        }
      }, delay);

      retryTimeouts.current.set(update.id, timeoutId);
    },
    [removeOptimisticUpdate]
  );

  // Perform vote update
  const performVoteUpdate = useCallback(
    async (update: OptimisticUpdate): Promise<boolean> => {
      try {
        const controller = new AbortController();
        abortControllers.current.set(update.id, controller);

        const voteType = update.data.upvotes ? "upvote" : "downvote";

        const response = await fetch("/api/expose/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exposeId, voteType }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Vote failed: ${response.status}`);

        const data = await response.json();
        if (!data.success) throw new Error("Vote API returned failure");

        // Update actual metrics with server response
        setMetrics((prev) => ({
          ...prev,
          upvotes: data.data.upvotes,
          downvotes: data.data.downvotes,
          netVotes: data.data.netVotes,
        }));

        removeOptimisticUpdate(update.id);
        abortControllers.current.delete(update.id);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return false; // Don't retry aborted requests
        }
        console.error("Vote update failed:", error);
        return false;
      }
    },
    [exposeId, removeOptimisticUpdate]
  );

  // Perform comment update
  const performCommentUpdate = useCallback(
    async (update: OptimisticUpdate): Promise<boolean> => {
      try {
        // For comment updates, we just need to refresh the metrics from server
        // since the actual comment submission is handled separately
        const controller = new AbortController();
        abortControllers.current.set(update.id, controller);

        const response = await fetch(`/api/expose?exposeId=${exposeId}`, {
          signal: controller.signal,
        });

        if (!response.ok)
          throw new Error(`Metrics refresh failed: ${response.status}`);

        const data = await response.json();
        if (!data.success) throw new Error("Metrics API returned failure");

        const expose = data.data.exposes.find(
          (e: any) => e.exposeId === exposeId
        );
        if (expose) {
          setMetrics((prev) => ({
            ...prev,
            comments: expose.commentCount || 0,
          }));
        }

        removeOptimisticUpdate(update.id);
        abortControllers.current.delete(update.id);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return false;
        }
        console.error("Comment metrics update failed:", error);
        return false;
      }
    },
    [exposeId, removeOptimisticUpdate]
  );

  // Perform view update
  const performViewUpdate = useCallback(
    async (update: OptimisticUpdate): Promise<boolean> => {
      try {
        const controller = new AbortController();
        abortControllers.current.set(update.id, controller);

        const response = await fetch("/api/expose/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exposeId }),
          signal: controller.signal,
        });

        if (!response.ok)
          throw new Error(`View tracking failed: ${response.status}`);

        const data = await response.json();
        if (!data.success) throw new Error("View API returned failure");

        // Update metrics with the returned view count
        if (typeof data.viewCount === "number") {
          setMetrics((prev) => ({
            ...prev,
            views: data.viewCount,
          }));
        }

        removeOptimisticUpdate(update.id);
        abortControllers.current.delete(update.id);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return false;
        }
        console.error("View update failed:", error);
        return false;
      }
    },
    [exposeId, removeOptimisticUpdate]
  );

  // Perform share update
  const performShareUpdate = useCallback(
    async (update: OptimisticUpdate): Promise<boolean> => {
      try {
        const controller = new AbortController();
        abortControllers.current.set(update.id, controller);

        const response = await fetch("/api/expose/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exposeId }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Share failed: ${response.status}`);

        const data = await response.json();
        if (!data.success) throw new Error("Share API returned failure");

        setMetrics((prev) => ({
          ...prev,
          shares: data.data.shareCount || prev.shares + 1,
        }));

        removeOptimisticUpdate(update.id);
        abortControllers.current.delete(update.id);
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return false;
        }
        console.error("Share update failed:", error);
        return false;
      }
    },
    [exposeId, removeOptimisticUpdate]
  );

  // Update vote with optimistic UI
  const updateVote = useCallback(
    async (voteType: "upvote" | "downvote"): Promise<boolean> => {
      const updateId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const currentMetrics = getCurrentMetrics();

      const optimisticData: Partial<MetricsState> = {
        upvotes:
          voteType === "upvote"
            ? currentMetrics.upvotes + 1
            : currentMetrics.upvotes,
        downvotes:
          voteType === "downvote"
            ? currentMetrics.downvotes + 1
            : currentMetrics.downvotes,
        netVotes:
          voteType === "upvote"
            ? currentMetrics.netVotes + 1
            : currentMetrics.netVotes - 1,
      };

      const update: OptimisticUpdate = {
        id: updateId,
        type: "vote",
        data: optimisticData,
        timestamp: Date.now(),
        retryCount: 0,
      };

      applyOptimisticUpdate(update);
      setIsUpdating(true);

      try {
        const success = await performVoteUpdate(update);
        if (!success) {
          await retryUpdate(update);
        }
        return success;
      } finally {
        setIsUpdating(false);
      }
    },
    [getCurrentMetrics, applyOptimisticUpdate, performVoteUpdate, retryUpdate]
  );

  // Update comment count with optimistic UI
  const updateComment = useCallback(
    async (increment: number): Promise<boolean> => {
      const updateId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const currentMetrics = getCurrentMetrics();

      const optimisticData: Partial<MetricsState> = {
        comments: Math.max(0, currentMetrics.comments + increment),
      };

      const update: OptimisticUpdate = {
        id: updateId,
        type: "comment",
        data: optimisticData,
        timestamp: Date.now(),
        retryCount: 0,
      };

      applyOptimisticUpdate(update);
      setIsUpdating(true);

      try {
        const success = await performCommentUpdate(update);
        if (!success) {
          await retryUpdate(update);
        }
        return success;
      } finally {
        setIsUpdating(false);
      }
    },
    [
      getCurrentMetrics,
      applyOptimisticUpdate,
      performCommentUpdate,
      retryUpdate,
    ]
  );

  // Update view count
  const updateView = useCallback(async (): Promise<boolean> => {
    const updateId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentMetrics = getCurrentMetrics();

    const optimisticData: Partial<MetricsState> = {
      views: currentMetrics.views + 1,
    };

    const update: OptimisticUpdate = {
      id: updateId,
      type: "view",
      data: optimisticData,
      timestamp: Date.now(),
      retryCount: 0,
    };

    applyOptimisticUpdate(update);

    try {
      const success = await performViewUpdate(update);
      if (!success) {
        await retryUpdate(update);
      }
      return success;
    } catch (error) {
      console.error("View update failed:", error);
      return false;
    }
  }, [
    getCurrentMetrics,
    applyOptimisticUpdate,
    performViewUpdate,
    retryUpdate,
  ]);

  // Update share count
  const updateShare = useCallback(async (): Promise<boolean> => {
    const updateId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentMetrics = getCurrentMetrics();

    const optimisticData: Partial<MetricsState> = {
      shares: currentMetrics.shares + 1,
    };

    const update: OptimisticUpdate = {
      id: updateId,
      type: "share",
      data: optimisticData,
      timestamp: Date.now(),
      retryCount: 0,
    };

    applyOptimisticUpdate(update);
    setIsUpdating(true);

    try {
      const success = await performShareUpdate(update);
      if (!success) {
        await retryUpdate(update);
      }
      return success;
    } finally {
      setIsUpdating(false);
    }
  }, [
    getCurrentMetrics,
    applyOptimisticUpdate,
    performShareUpdate,
    retryUpdate,
  ]);

  // Refresh metrics from server
  const refreshMetrics = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/expose?exposeId=${exposeId}`);
      if (!response.ok) throw new Error(`Refresh failed: ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error("Refresh API returned failure");

      const expose = data.data.exposes.find(
        (e: any) => e.exposeId === exposeId
      );
      if (expose) {
        const refreshedMetrics: MetricsState = {
          views: expose.views || 0,
          comments: expose.commentCount || 0,
          upvotes: expose.upvotes || 0,
          downvotes: expose.downvotes || 0,
          netVotes: expose.netVotes || 0,
          shares: expose.shareCount || 0,
        };

        setMetrics(refreshedMetrics);

        // Clear optimistic updates since we have fresh data
        setOptimisticUpdates([]);

        if (onMetricsChange) {
          onMetricsChange(refreshedMetrics);
        }
      }
    } catch (error) {
      console.error("Failed to refresh metrics:", error);
    }
  }, [exposeId, onMetricsChange]);

  // Notify parent of metrics changes
  useEffect(() => {
    const currentMetrics = getCurrentMetrics();
    if (onMetricsChange) {
      onMetricsChange(currentMetrics);
    }
  }, [getCurrentMetrics, onMetricsChange]);

  return {
    metrics: getCurrentMetrics(),
    isUpdating,
    updateVote,
    updateComment,
    updateView,
    updateShare,
    refreshMetrics,
    hasOptimisticUpdates: optimisticUpdates.length > 0,
  };
}
