"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRealTimeMetrics } from "@/lib/hooks/useRealTimeMetrics";
import ExposeCard, { ExposeCardRef } from "./ExposeCard";
import CommentSection from "./CommentSection";
import CommentForm from "./CommentForm";
import { ErrorBoundary } from "./ErrorBoundary";

interface Expose {
  _id: string;
  exposeId: string;
  title: string;
  description: string;
  hashtag: string;
  imageUrls: string[];
  audioUrl?: string;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  timeRemaining: number;
  createdAt: string;
  views?: number;
  commentCount?: number;
  shareCount?: number;
}

interface Comment {
  _id: string;
  commentId: string;
  exposeId: string;
  content: string;
  anonymousId: string;
  timeAgo: string;
  createdAt: string;
}

interface RealTimeExposeCardProps {
  expose: Expose;
  onVote?: (exposeId: string, voteType: "upvote" | "downvote") => void;
  onMetricsChange?: (exposeId: string, metrics: any) => void;
  showComments?: boolean;
  className?: string;
}

export default function RealTimeExposeCard({
  expose,
  onVote,
  onMetricsChange,
  showComments = true,
  className = "",
}: RealTimeExposeCardProps) {
  const exposeCardRef = useRef<ExposeCardRef>(null);
  const [localCommentCount, setLocalCommentCount] = useState(
    expose.commentCount || 0
  );

  // Use real-time metrics hook
  const {
    metrics,
    isUpdating,
    updateVote,
    updateComment,
    updateView,
    updateShare,
    refreshMetrics,
    hasOptimisticUpdates,
  } = useRealTimeMetrics({
    exposeId: expose.exposeId,
    initialMetrics: {
      views: expose.views || 0,
      comments: expose.commentCount || 0,
      upvotes: expose.upvotes || 0,
      downvotes: expose.downvotes || 0,
      netVotes: expose.netVotes || 0,
      shares: expose.shareCount || 0,
    },
    onMetricsChange: (newMetrics) => {
      // Notify parent component of metrics changes
      if (onMetricsChange) {
        onMetricsChange(expose.exposeId, newMetrics);
      }

      // Update local comment count
      setLocalCommentCount(newMetrics.comments);
    },
  });

  // Track view on component mount
  useEffect(() => {
    let mounted = true;

    const trackView = async () => {
      try {
        if (
          mounted &&
          expose.exposeId &&
          expose.exposeId.startsWith("expose_")
        ) {
          await updateView();
        }
      } catch (error) {
        console.warn("Failed to track view:", error);
      }
    };

    // Small delay to avoid tracking views too aggressively
    const timeoutId = setTimeout(trackView, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [expose.exposeId, updateView]);

  // Handle vote with real-time updates
  const handleVote = useCallback(
    async (exposeId: string, voteType: "upvote" | "downvote") => {
      try {
        await updateVote(voteType);

        // Also call the original onVote handler for backward compatibility
        if (onVote) {
          onVote(exposeId, voteType);
        }
      } catch (error) {
        console.error("Vote failed:", error);
      }
    },
    [updateVote, onVote]
  );

  // Handle comment count changes
  const handleCommentCountChange = useCallback(
    (newCount: number) => {
      const currentCount = metrics.comments;
      const increment = newCount - currentCount;

      if (increment !== 0) {
        updateComment(increment);
      }

      setLocalCommentCount(newCount);
    },
    [metrics.comments, updateComment]
  );

  // Handle new comment submission
  const handleCommentSubmit = useCallback(
    (comment: Comment) => {
      // Optimistically increment comment count
      updateComment(1);
      setLocalCommentCount((prev) => prev + 1);
    },
    [updateComment]
  );

  // Handle share action
  const handleShare = useCallback(async () => {
    try {
      await updateShare();
    } catch (error) {
      console.error("Share failed:", error);
    }
  }, [updateShare]);

  // Refresh metrics periodically to ensure consistency
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasOptimisticUpdates) {
        refreshMetrics();
      }
    }, 30000); // Refresh every 30 seconds when no optimistic updates

    return () => clearInterval(interval);
  }, [hasOptimisticUpdates, refreshMetrics]);

  // Create enhanced expose object with real-time metrics
  const enhancedExpose = {
    ...expose,
    upvotes: metrics.upvotes,
    downvotes: metrics.downvotes,
    netVotes: metrics.netVotes,
    views: metrics.views,
    commentCount: metrics.comments,
    shareCount: metrics.shares,
  };

  return (
    <div className={`real-time-expose-card ${className}`}>
      <ExposeCard
        ref={exposeCardRef}
        expose={enhancedExpose}
        onVote={handleVote}
        onCommentCountChange={(exposeId, newCount) =>
          handleCommentCountChange(newCount)
        }
        onShareCountChange={(exposeId, newCount) => {
          // Share count is handled by the real-time metrics hook
        }}
      />

      {showComments && (
        <div className="mt-0">
          <ErrorBoundary
            fallback={
              <div className="p-4 text-center text-gray-500 text-sm">
                Comments temporarily unavailable
              </div>
            }
          >
            <CommentSection
              exposeId={expose.exposeId}
              initialCommentCount={localCommentCount}
              onCommentCountChangeAction={handleCommentCountChange}
            />
            <CommentForm
              exposeId={expose.exposeId}
              onCommentSubmitAction={handleCommentSubmit}
              onCommentCountChange={handleCommentCountChange}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Debug indicator for optimistic updates (only in development) */}
      {process.env.NODE_ENV === "development" && hasOptimisticUpdates && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs z-50">
          Updating metrics...
        </div>
      )}
    </div>
  );
}
