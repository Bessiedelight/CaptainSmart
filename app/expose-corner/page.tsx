"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import CommentSection from "@/components/CommentSection";
import CommentForm from "@/components/CommentForm";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import { ExposeCardSkeleton } from "@/components/LoadingSkeletons";
import ExposeCornerNavClean from "@/components/ExposeCornerNavClean";
import { UIAnimations, AnimationPerformance } from "@/lib/utils/animations";
import {
  Plus,
  RefreshCw,
  Eye,
  MessageCircle,
  Heart,
  Share,
  Bookmark,
  Clock,
  MoreHorizontal,
  Repeat2,
  Mic,
} from "lucide-react";

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

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

function ExposeCornerContent() {
  const [exposes, setExposes] = useState<Expose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState("all");
  const [selectedSort, setSelectedSort] = useState<
    "newest" | "trending" | "expiring"
  >("newest");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const [optimisticVotes, setOptimisticVotes] = useState<
    Record<string, { upvotes: number; downvotes: number; netVotes: number }>
  >({});
  const [votingInProgress, setVotingInProgress] = useState<Set<string>>(
    new Set()
  );
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Optimized animations with performance monitoring
  useEffect(() => {
    if (containerRef.current) {
      AnimationPerformance.startMeasure("pageLoad");
      UIAnimations.animateIn(containerRef.current, "fadeInUp", {
        duration: 0.6,
        onComplete: () => {
          AnimationPerformance.endMeasure("pageLoad");
        },
      });
    }
  }, []);

  const fetchExposes = useCallback(
    async (reset = false) => {
      try {
        AnimationPerformance.startMeasure("fetchExposes");

        if (reset) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const offset = reset ? 0 : pagination.offset + pagination.limit;
        const params = new URLSearchParams({
          hashtag: selectedHashtag,
          sort: selectedSort,
          limit: pagination.limit.toString(),
          offset: offset.toString(),
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout

        const response = await fetch(`/api/expose?${params}`, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache", // Ensure fresh data
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Request failed");
        }

        if (reset) {
          setExposes(data.data.exposes);

          // Initialize comment counts
          const initialCommentCounts: Record<string, number> = {};
          data.data.exposes.forEach((expose: Expose) => {
            initialCommentCounts[expose.exposeId] = expose.commentCount || 0;
          });
          setCommentCounts(initialCommentCounts);

          // Animate new content with optimized performance
          requestAnimationFrame(() => {
            const exposeCards = document.querySelectorAll(".expose-card");
            if (exposeCards.length > 0) {
              UIAnimations.animateIn(exposeCards, "fadeInUp", {
                stagger: 0.08,
                duration: 0.4,
              });
            }
          });
        } else {
          const newExposes = data.data.exposes;
          setExposes((prev) => [...prev, ...newExposes]);

          // Add comment counts for new exposes
          const newCommentCounts: Record<string, number> = {};
          newExposes.forEach((expose: Expose) => {
            newCommentCounts[expose.exposeId] = expose.commentCount || 0;
          });
          setCommentCounts((prev) => ({ ...prev, ...newCommentCounts }));

          // Animate new cards
          requestAnimationFrame(() => {
            const allCards = document.querySelectorAll(".expose-card");
            const newCards = Array.from(allCards).slice(-newExposes.length);
            if (newCards.length > 0) {
              UIAnimations.animateIn(newCards, "fadeInUp", {
                stagger: 0.06,
                duration: 0.3,
              });
            }
          });
        }

        setPagination({
          ...data.data.pagination,
          offset,
        });

        const duration = AnimationPerformance.endMeasure("fetchExposes");
        if (duration > 2000) {
          console.warn(`Slow expose fetch: ${duration}ms`);
        }
      } catch (err) {
        console.error("Error fetching exposes:", err);

        // Provide more specific error messages
        let errorMessage = "Failed to load exposes";
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage = "Request timed out. Please check your connection.";
          } else if (err.message.includes("Failed to fetch")) {
            errorMessage =
              "Network error. Please check your internet connection.";
          } else if (err.message.includes("Server error")) {
            errorMessage =
              "Server is temporarily unavailable. Please try again later.";
          }
        }

        setError(errorMessage);
        AnimationPerformance.endMeasure("fetchExposes");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedHashtag, selectedSort, pagination.limit, pagination.offset]
  );

  useEffect(() => {
    fetchExposes(true);
  }, [selectedHashtag, selectedSort]);

  // Track views for visible exposes
  const trackView = useCallback(async (exposeId: string) => {
    try {
      await fetch("/api/expose/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exposeId }),
      });
    } catch (error) {
      // Silently fail view tracking to not disrupt user experience
      console.warn("Failed to track view for expose:", exposeId);
    }
  }, []);

  // Track views when exposes are first loaded
  useEffect(() => {
    if (exposes.length > 0) {
      exposes.forEach((expose) => {
        trackView(expose.exposeId);
      });
    }
  }, [exposes, trackView]);

  const handleVote = async (
    exposeId: string,
    voteType: "upvote" | "downvote"
  ) => {
    const currentExpose = exposes.find((e) => e.exposeId === exposeId);
    if (!currentExpose || votingInProgress.has(exposeId)) return;

    // Set voting in progress
    setVotingInProgress((prev) => new Set(prev).add(exposeId));

    const optimisticUpdate = {
      upvotes:
        voteType === "upvote"
          ? currentExpose.upvotes + 1
          : currentExpose.upvotes,
      downvotes:
        voteType === "downvote"
          ? currentExpose.downvotes + 1
          : currentExpose.downvotes,
      netVotes:
        voteType === "upvote"
          ? currentExpose.netVotes + 1
          : currentExpose.netVotes - 1,
    };

    setOptimisticVotes((prev) => ({
      ...prev,
      [exposeId]: optimisticUpdate,
    }));

    // Animate vote button with optimized performance
    const voteButton = document.querySelector(
      `[data-vote-${voteType}="${exposeId}"]`
    );
    if (voteButton) {
      UIAnimations.animateButton(voteButton as Element, "click");
    }

    try {
      const response = await fetch("/api/expose/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exposeId, voteType }),
      });

      if (!response.ok) throw new Error("Vote failed");

      const data = await response.json();
      if (!data.success) throw new Error("Vote failed");

      setExposes((prev) =>
        prev.map((expose) =>
          expose.exposeId === exposeId
            ? {
                ...expose,
                upvotes: data.data.upvotes,
                downvotes: data.data.downvotes,
                netVotes: data.data.netVotes,
              }
            : expose
        )
      );

      setOptimisticVotes((prev) => {
        const updated = { ...prev };
        delete updated[exposeId];
        return updated;
      });
    } catch (error) {
      console.error("Vote error:", error);

      // Revert optimistic update
      setOptimisticVotes((prev) => {
        const updated = { ...prev };
        delete updated[exposeId];
        return updated;
      });

      // Show user-friendly error message (you can implement toast notifications later)
      console.warn("Failed to submit vote. Please try again.");
    } finally {
      // Clear voting in progress
      setVotingInProgress((prev) => {
        const updated = new Set(prev);
        updated.delete(exposeId);
        return updated;
      });
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.hasMore) {
      fetchExposes(false);
    }
  };

  const handleRefresh = () => {
    fetchExposes(true);
  };

  // Handle comment count updates
  const handleCommentCountChange = useCallback(
    (exposeId: string, count: number) => {
      setCommentCounts((prev) => ({
        ...prev,
        [exposeId]: count,
      }));

      // Also update the expose in the main list
      setExposes((prev) =>
        prev.map((expose) =>
          expose.exposeId === exposeId
            ? { ...expose, commentCount: count }
            : expose
        )
      );
    },
    []
  );

  // Handle new comment submission
  const handleCommentSubmit = useCallback(
    (exposeId: string, comment: Comment) => {
      // Update comment count optimistically
      const currentCount = commentCounts[exposeId] || 0;
      handleCommentCountChange(exposeId, currentCount + 1);
    },
    [commentCounts, handleCommentCountChange]
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "now";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white" ref={containerRef}>
        <ExposeCornerNavClean />

        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-black">Expose Corner</h1>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimized loading skeletons */}
        <div className="max-w-4xl mx-auto space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <ExposeCardSkeleton key={i} animated={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" ref={containerRef}>
      <ExposeCornerNavClean />

      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-black">Expose Corner</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isLoading ? "Refreshing..." : "Refresh"}
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
              <Link
                href="/expose-corner/create"
                className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200"
              >
                Post
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setSelectedSort("newest")}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
              selectedSort === "newest"
                ? "text-black border-black"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            For you
          </button>
          <button
            onClick={() => setSelectedSort("trending")}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
              selectedSort === "trending"
                ? "text-black border-black"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Trending
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Compose Tweet */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <Link href="/expose-corner/create">
                <div className="text-xl text-gray-500 py-3 cursor-text hover:bg-gray-50 transition-colors rounded-lg px-3">
                  What's happening?
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 text-center bg-red-50 border border-red-200 rounded-lg mx-4 my-4">
            <div className="text-red-800 mb-3 font-medium">{error}</div>
            <button
              onClick={() => {
                setError(null);
                fetchExposes(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Exposes Feed */}
        {exposes.length > 0 ? (
          <div>
            {exposes.map((expose) => {
              const voteData = optimisticVotes[expose.exposeId] || {
                upvotes: expose.upvotes,
                downvotes: expose.downvotes,
                netVotes: expose.netVotes,
              };

              return (
                <article
                  key={expose._id}
                  className="expose-card border-b border-gray-200 p-4 hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-gray-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="font-bold text-black text-[15px]">
                          Anonymous
                        </span>
                        <span className="text-gray-500 text-[15px]">
                          @anonymous
                        </span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500 text-[15px] hover:underline cursor-pointer">
                          {formatTime(expose.createdAt)}
                        </span>
                        {expose.hashtag && (
                          <>
                            <span className="text-gray-500">·</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHashtag(expose.hashtag);
                              }}
                              className="text-blue-500 text-[15px] hover:underline"
                              aria-label={`Filter by hashtag ${expose.hashtag}`}
                            >
                              {expose.hashtag}
                            </button>
                          </>
                        )}
                        <div className="ml-auto">
                          <button className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-black font-semibold text-[15px] mb-1 leading-tight">
                        {expose.title}
                      </h3>

                      {/* Description */}
                      <p className="text-black text-[15px] mb-3 leading-normal whitespace-pre-wrap">
                        {expose.description}
                      </p>

                      {/* Images */}
                      {expose.imageUrls && expose.imageUrls.length > 0 && (
                        <div
                          className={`mb-3 rounded-2xl overflow-hidden border border-gray-200 ${
                            expose.imageUrls.length === 1
                              ? "max-h-80"
                              : expose.imageUrls.length === 2
                                ? "grid grid-cols-2 gap-0.5 max-h-64"
                                : "grid grid-cols-2 gap-0.5 max-h-64"
                          }`}
                        >
                          {expose.imageUrls
                            .slice(0, 4)
                            .map((imageUrl, index) => (
                              <div
                                key={index}
                                className={`relative ${
                                  expose.imageUrls.length === 1
                                    ? "w-full h-full"
                                    : "aspect-square"
                                }`}
                              >
                                <img
                                  src={imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                {index === 3 && expose.imageUrls.length > 4 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white font-semibold text-lg">
                                      +{expose.imageUrls.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Audio */}
                      {expose.audioUrl && (
                        <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 shadow-sm">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Mic className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                Audio Message
                              </p>
                              <p className="text-xs text-gray-600">
                                Tap to play
                              </p>
                            </div>
                          </div>
                          <audio
                            controls
                            className="w-full h-10 rounded-lg"
                            preload="metadata"
                            style={{
                              filter:
                                "sepia(20%) saturate(70%) hue-rotate(315deg) brightness(1.1)",
                            }}
                          >
                            <source src={expose.audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between max-w-md mt-3 -ml-2">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200 group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors duration-200">
                            <MessageCircle className="w-[18px] h-[18px]" />
                          </div>
                          <span className="text-[13px] min-w-[20px]">
                            {formatNumber(
                              commentCounts[expose.exposeId] ||
                                expose.commentCount ||
                                0
                            )}
                          </span>
                        </button>

                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors duration-200 group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors duration-200">
                            <Repeat2 className="w-[18px] h-[18px]" />
                          </div>
                          <span className="text-[13px] min-w-[20px]">
                            {formatNumber(expose.shareCount || 0)}
                          </span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(expose.exposeId, "upvote");
                          }}
                          disabled={votingInProgress.has(expose.exposeId)}
                          data-vote-upvote={expose.exposeId}
                          className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={
                            votingInProgress.has(expose.exposeId)
                              ? "Voting..."
                              : "Upvote"
                          }
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-50 transition-colors duration-200">
                            <Heart className="w-[18px] h-[18px]" />
                          </div>
                          <span className="text-[13px] min-w-[20px]">
                            {formatNumber(voteData.upvotes || 0)}
                          </span>
                        </button>

                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200 group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors duration-200">
                            <Bookmark className="w-[18px] h-[18px]" />
                          </div>
                        </button>

                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200 group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors duration-200">
                            <Share className="w-[18px] h-[18px]" />
                          </div>
                        </button>
                      </div>

                      {/* Time remaining */}
                      {expose.timeRemaining > 0 && (
                        <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {Math.floor(
                              expose.timeRemaining / (1000 * 60 * 60 * 24)
                            )}{" "}
                            days remaining
                          </span>
                        </div>
                      )}

                      {/* Comment Section */}
                      <div className="mt-3 -mx-4">
                        <ErrorBoundary
                          fallback={
                            <div className="p-4 text-center text-gray-500 text-sm">
                              Comments temporarily unavailable
                            </div>
                          }
                        >
                          <CommentSection
                            exposeId={expose.exposeId}
                            initialCommentCount={
                              commentCounts[expose.exposeId] ||
                              expose.commentCount ||
                              0
                            }
                            onCommentCountChangeAction={(count) =>
                              handleCommentCountChange(expose.exposeId, count)
                            }
                          />
                          <CommentForm
                            exposeId={expose.exposeId}
                            onCommentSubmitAction={(comment) =>
                              handleCommentSubmit(expose.exposeId, comment)
                            }
                          />
                        </ErrorBoundary>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          !isLoading &&
          !error && (
            <div className="text-center py-16 px-8">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  Welcome to Expose Corner
                </h3>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  This is where you can share anonymous stories and experiences.
                  Be the first to post!
                </p>
                <Link
                  href="/expose-corner/create"
                  className="inline-flex items-center space-x-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-full font-medium transition-colors duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create your first post</span>
                </Link>
              </div>
            </div>
          )
        )}

        {/* Optimized Load More */}
        {pagination.hasMore && exposes.length > 0 && (
          <div className="border-b border-gray-200 p-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className={`w-full py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${
                isLoadingMore
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed scale-100"
                  : "text-blue-500 hover:bg-blue-50 hover:shadow-md"
              }`}
              onMouseEnter={(e) => {
                if (!isLoadingMore) {
                  UIAnimations.animateButton(e.currentTarget, "hover");
                }
              }}
            >
              {isLoadingMore ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading more posts...</span>
                </div>
              ) : (
                `Load more posts (${pagination.total - exposes.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Performance Monitor for Development */}
      <PerformanceMonitor
        enabled={process.env.NODE_ENV === "development"}
        position="bottom-right"
      />
    </div>
  );
}

export default function ExposeCornerPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong with Expose Corner
            </h2>
            <p className="text-gray-600 mb-4">
              Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <ExposeCornerContent />
    </ErrorBoundary>
  );
}
