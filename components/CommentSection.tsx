"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, RefreshCw, AlertCircle, User } from "lucide-react";
import { gsap } from "gsap";
import { CommentSkeleton } from "./LoadingSkeletons";
import { UIAnimations, AnimationPerformance } from "@/lib/utils/animations";

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

interface CommentSectionProps {
  exposeId: string;
  initialCommentCount: number;
  onCommentCountChangeAction: (count: number) => void;
}

interface CommentsResponse {
  success: boolean;
  data?: {
    comments: Comment[];
    pagination: PaginationInfo;
    exposeId: string;
  };
  error?: string;
  code?: string;
}

export default function CommentSection({
  exposeId,
  initialCommentCount,
  onCommentCountChangeAction,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: initialCommentCount,
    limit: 10,
    offset: 0,
    hasMore: false,
  });

  // Refs for animations
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  // Fetch comments from API with performance monitoring
  const fetchComments = useCallback(
    async (reset = false) => {
      try {
        // Start performance measurement
        AnimationPerformance.startMeasure("fetchComments");

        if (reset) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const offset = reset ? 0 : pagination.offset + pagination.limit;
        const params = new URLSearchParams({
          exposeId,
          limit: pagination.limit.toString(),
          offset: offset.toString(),
          sort: "newest",
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout

        const response = await fetch(`/api/expose/comments?${params}`, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache", // Ensure fresh data for real-time updates
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }

        const data: CommentsResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch comments");
        }

        if (data.data) {
          if (reset) {
            setComments(data.data.comments);
            // Animate new comments in with optimized performance
            if (commentsListRef.current && data.data.comments.length > 0) {
              UIAnimations.animateIn(
                commentsListRef.current.children,
                "fadeInUp",
                {
                  stagger: 0.08,
                  duration: 0.4,
                }
              );
            }
          } else {
            const newComments = data.data.comments;
            setComments((prev) => [...prev, ...newComments]);

            // Animate newly loaded comments with lazy loading optimization
            requestAnimationFrame(() => {
              if (commentsListRef.current && newComments.length > 0) {
                const newElements = Array.from(
                  commentsListRef.current.children
                ).slice(-newComments.length);

                UIAnimations.animateIn(newElements, "fadeInUp", {
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

          // Update parent component with actual comment count
          if (data.data.pagination.total !== initialCommentCount) {
            onCommentCountChangeAction(data.data.pagination.total);
          }
        }

        // End performance measurement
        const duration = AnimationPerformance.endMeasure("fetchComments");
        if (duration > 1000) {
          console.warn(`Slow comment fetch: ${duration}ms`);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);

        let errorMessage = "Failed to load comments";
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage = "Request timed out. Please try again.";
          } else if (err.message.includes("Failed to fetch")) {
            errorMessage = "Network error. Please check your connection.";
          } else if (err.message.includes("Server error")) {
            errorMessage = "Server temporarily unavailable.";
          }
        }

        setError(errorMessage);

        // Animate error state
        if (sectionRef.current) {
          UIAnimations.animateError(sectionRef.current);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      exposeId,
      pagination.limit,
      pagination.offset,
      initialCommentCount,
      onCommentCountChangeAction,
    ]
  );

  // Load comments when section is expanded
  useEffect(() => {
    if (isExpanded && comments.length === 0 && !isLoading) {
      fetchComments(true);
    }
  }, [isExpanded, comments.length, isLoading, fetchComments]);

  // Handle expanding/collapsing comment section with optimized animation
  const handleToggleExpanded = () => {
    AnimationPerformance.startMeasure("commentSectionToggle");

    if (!isExpanded) {
      setIsExpanded(true);
      // Animate expansion with improved performance
      if (contentRef.current) {
        const tl = UIAnimations.createMasterTimeline({
          onComplete: () => {
            AnimationPerformance.endMeasure("commentSectionToggle");
          },
        });

        tl.fromTo(
          contentRef.current,
          { height: 0, opacity: 0 },
          {
            height: "auto",
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          }
        );
      }
    } else {
      // Animate collapse with cleanup
      if (contentRef.current) {
        const tl = UIAnimations.createMasterTimeline({
          onComplete: () => {
            setIsExpanded(false);
            AnimationPerformance.endMeasure("commentSectionToggle");
          },
        });

        tl.to(contentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        });
      }
    }
  };

  // Handle loading more comments
  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.hasMore) {
      fetchComments(false);
    }
  };

  // Handle retry on error
  const handleRetry = () => {
    setError(null);
    fetchComments(true);
  };

  // Format comment display name
  const getDisplayName = (anonymousId: string) => {
    // Extract last 4 characters for display
    const suffix = anonymousId.slice(-4);
    return `Anonymous ${suffix}`;
  };

  // Format time display
  const formatTime = (timeAgo: string, createdAt: string) => {
    if (timeAgo === "now") return "now";
    if (
      timeAgo.includes("m") ||
      timeAgo.includes("h") ||
      timeAgo.includes("d")
    ) {
      return timeAgo;
    }
    // Fallback to formatted date
    return new Date(createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div ref={sectionRef} className="border-t border-gray-200">
      {/* Comment Section Header */}
      <button
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Hide comments" : "Show comments"}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium">
            {pagination.total === 0
              ? "No comments yet"
              : pagination.total === 1
                ? "1 comment"
                : `${pagination.total} comments`}
          </span>
        </div>
        <div
          className={`transform transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Comments Content */}
      {isExpanded && (
        <div
          ref={contentRef}
          className="border-t border-gray-100 overflow-hidden"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-6">
              <div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading comments...</span>
              </div>
              {/* Enhanced loading skeletons with optimized animations */}
              <CommentSkeleton count={3} animated={true} />
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-6">
              <div className="flex items-center justify-center space-x-2 text-red-600 mb-4">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <div className="text-center">
                <button
                  onClick={handleRetry}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          {!isLoading && !error && (
            <>
              {comments.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                <div ref={commentsListRef} className="divide-y divide-gray-100">
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="p-4 opacity-0"
                      style={{ opacity: 1 }}
                    >
                      <div className="flex space-x-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>

                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          {/* Comment Header */}
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">
                              {getDisplayName(comment.anonymousId)}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {formatTime(comment.timeAgo, comment.createdAt)}
                            </span>
                          </div>

                          {/* Comment Text */}
                          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {pagination.hasMore && comments.length > 0 && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className={`w-full py-3 rounded-full text-sm font-medium transition-colors duration-200 ${
                      isLoadingMore
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "text-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading more...</span>
                      </div>
                    ) : (
                      `Load more comments (${pagination.total - comments.length} remaining)`
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
