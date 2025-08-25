"use client";

import {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
  useCallback,
} from "react";
import Image from "next/image";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Eye,
  MessageCircle,
  Share2,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useRealTimeMetrics } from "@/lib/hooks/useRealTimeMetrics";
import { gsap } from "gsap";
import { UIAnimations, AnimationPerformance } from "@/lib/utils/animations";

interface ExposeCardProps {
  expose: {
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
  };
  onVote: (exposeId: string, voteType: "upvote" | "downvote") => void;
  onCommentCountChange?: (exposeId: string, newCount: number) => void;
  onShareCountChange?: (exposeId: string, newCount: number) => void;
}

export interface ExposeCardRef {
  updateCommentCount: (newCount: number) => void;
  updateShareCount: (newCount: number) => void;
  updateViewCount: (newCount: number) => void;
  refreshMetrics: () => Promise<void>;
  hasOptimisticUpdates: boolean;
}

const ExposeCard = forwardRef<ExposeCardRef, ExposeCardProps>(
  function ExposeCard(
    { expose, onVote, onCommentCountChange, onShareCountChange },
    ref
  ) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(expose.timeRemaining);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
      null
    );
    const [viewTracked, setViewTracked] = useState(false);

    // Refs for animations
    const cardRef = useRef<HTMLDivElement>(null);
    const metricsRef = useRef<HTMLDivElement>(null);
    const voteButtonsRef = useRef<HTMLDivElement>(null);

    // Use real-time metrics hook
    const {
      metrics,
      isUpdating,
      updateVote: updateVoteMetrics,
      updateView: updateViewMetrics,
      updateShare: updateShareMetrics,
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
        // Notify parent components of metrics changes
        onCommentCountChange?.(expose.exposeId, newMetrics.comments);
        onShareCountChange?.(expose.exposeId, newMetrics.shares);
      },
    });

    // Update countdown timer
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1000));
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    // Initialize audio element
    useEffect(() => {
      if (expose.audioUrl) {
        const audio = new Audio(expose.audioUrl);
        audio.addEventListener("ended", () => setIsAudioPlaying(false));
        setAudioElement(audio);

        return () => {
          audio.pause();
          audio.removeEventListener("ended", () => setIsAudioPlaying(false));
        };
      }
    }, [expose.audioUrl]);

    // Track view on component mount with real-time metrics
    useEffect(() => {
      const trackView = async () => {
        if (viewTracked) return; // Prevent multiple tracking calls

        try {
          // Only track view if exposeId is valid
          if (expose.exposeId && expose.exposeId.startsWith("expose_")) {
            await updateViewMetrics();
          }
          setViewTracked(true);
        } catch (error) {
          console.error("Failed to track view:", error);
          setViewTracked(true); // Mark as tracked to prevent retries
        }
      };

      trackView();
    }, [expose.exposeId, viewTracked, updateViewMetrics]);

    const formatTimeRemaining = (milliseconds: number) => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    const nextImage = () => {
      setCurrentImageIndex((prev) =>
        prev === expose.imageUrls.length - 1 ? 0 : prev + 1
      );
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) =>
        prev === 0 ? expose.imageUrls.length - 1 : prev - 1
      );
    };

    const toggleAudio = () => {
      if (!audioElement) return;

      if (isAudioPlaying) {
        audioElement.pause();
        setIsAudioPlaying(false);
      } else {
        audioElement.play();
        setIsAudioPlaying(true);
      }
    };

    const handleVote = useCallback(
      async (voteType: "upvote" | "downvote") => {
        try {
          AnimationPerformance.startMeasure("voteAnimation");

          // Animate vote button with optimized performance
          const buttonElement = voteButtonsRef.current?.querySelector(
            `[data-vote="${voteType}"]`
          ) as HTMLElement;

          if (buttonElement) {
            UIAnimations.animateButton(buttonElement, "click");
          }

          // Update metrics optimistically first
          await updateVoteMetrics(voteType);

          // Animate metrics update with performance monitoring
          if (metricsRef.current) {
            UIAnimations.animateButton(metricsRef.current, "success", {
              onComplete: () => {
                AnimationPerformance.endMeasure("voteAnimation");
              },
            });
          }

          // Also call the original onVote handler for backward compatibility
          onVote(expose.exposeId, voteType);
        } catch (error) {
          console.error("Vote failed:", error);

          // Animate error feedback with improved UX
          if (voteButtonsRef.current) {
            UIAnimations.animateError(
              voteButtonsRef.current,
              "Vote failed. Please try again."
            );
          }

          AnimationPerformance.endMeasure("voteAnimation");
        }
      },
      [updateVoteMetrics, onVote, expose.exposeId]
    );

    const handleShare = useCallback(async () => {
      try {
        AnimationPerformance.startMeasure("shareAnimation");

        // Animate share action with optimized performance
        if (metricsRef.current) {
          UIAnimations.animateButton(metricsRef.current, "success", {
            onComplete: () => {
              AnimationPerformance.endMeasure("shareAnimation");
            },
          });
        }

        await updateShareMetrics();

        // Add share functionality (copy to clipboard)
        if (navigator.share) {
          await navigator.share({
            title: expose.title,
            text: expose.description,
            url: window.location.href,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(window.location.href);

          // Show success feedback
          if (metricsRef.current) {
            UIAnimations.animateSuccess(
              metricsRef.current,
              "Link copied to clipboard!"
            );
          }
        }
      } catch (error) {
        console.error("Share failed:", error);

        if (metricsRef.current) {
          UIAnimations.animateError(
            metricsRef.current,
            "Share failed. Please try again."
          );
        }

        AnimationPerformance.endMeasure("shareAnimation");
      }
    }, [updateShareMetrics, expose.title, expose.description]);

    const updateCommentCount = useCallback(
      (newCount: number) => {
        // Animate comment count change with optimized performance
        if (metricsRef.current) {
          const commentElement = metricsRef.current.querySelector(
            '[data-metric="comments"]'
          );
          if (commentElement) {
            UIAnimations.animateMetricsUpdate(
              commentElement,
              metrics.comments,
              newCount,
              { duration: 0.4 }
            );
          }
        }

        // Update comment metrics through parent callback
        onCommentCountChange?.(expose.exposeId, newCount);
      },
      [onCommentCountChange, expose.exposeId, metrics.comments]
    );

    const updateShareCount = useCallback(
      (newCount: number) => {
        // This is handled by the real-time metrics hook
        onShareCountChange?.(expose.exposeId, newCount);
      },
      [onShareCountChange, expose.exposeId]
    );

    const updateViewCount = useCallback((_newCount: number) => {
      // This is handled by the real-time metrics hook
      // Views are tracked automatically on mount
    }, []);

    // Expose methods to parent components via ref
    useImperativeHandle(ref, () => ({
      updateCommentCount,
      updateShareCount,
      updateViewCount,
      refreshMetrics,
      hasOptimisticUpdates,
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded-full">
              {expose.hashtag}
            </span>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              {timeLeft > 0 ? formatTimeRemaining(timeLeft) : "Expired"}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {expose.title}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
            {expose.description}
          </p>

          {/* Images */}
          {expose.imageUrls.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <div className="aspect-video relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <Image
                    src={expose.imageUrls[currentImageIndex]}
                    alt={`Image ${currentImageIndex + 1} for ${expose.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                {/* Image navigation */}
                {expose.imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Image indicators */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {expose.imageUrls.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-white bg-opacity-50"
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {expose.imageUrls.length > 1 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {currentImageIndex + 1} of {expose.imageUrls.length}
                </p>
              )}
            </div>
          )}

          {/* Audio */}
          {expose.audioUrl && (
            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleAudio}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors"
                    aria-label={isAudioPlaying ? "Pause audio" : "Play audio"}
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Audio recording
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with voting and metrics */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div
            ref={voteButtonsRef}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleVote("upvote")}
                className={`flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors ${
                  isUpdating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isUpdating}
                aria-label="Upvote"
                data-vote="upvote"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium" data-metric="upvotes">
                  {metrics.upvotes}
                </span>
              </button>

              <button
                onClick={() => handleVote("downvote")}
                className={`flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors ${
                  isUpdating ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isUpdating}
                aria-label="Downvote"
                data-vote="downvote"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium" data-metric="downvotes">
                  {metrics.downvotes}
                </span>
              </button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Net: {metrics.netVotes > 0 ? "+" : ""}
              {metrics.netVotes}
              {hasOptimisticUpdates && (
                <span
                  className="ml-1 text-xs text-blue-500"
                  title="Updating..."
                >
                  ⟳
                </span>
              )}
            </div>
          </div>

          {/* Metrics display */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              {/* View count */}
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <Eye className="w-4 h-4" />
                <span
                  className="text-sm"
                  title={`${metrics.views} views`}
                  data-metric="views"
                >
                  {formatNumber(metrics.views)}
                </span>
              </div>

              {/* Comment count */}
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-4 h-4" />
                <span
                  className="text-sm"
                  title={`${metrics.comments} comments`}
                  data-metric="comments"
                >
                  {formatNumber(metrics.comments)}
                </span>
              </div>

              {/* Share count - only show if greater than 0 */}
              {metrics.shares > 0 && (
                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <Share2 className="w-4 h-4" />
                  <span
                    className="text-sm"
                    title={`${metrics.shares} shares`}
                    data-metric="shares"
                  >
                    {formatNumber(metrics.shares)}
                  </span>
                </div>
              )}
            </div>

            {/* Engagement rate indicator - only show if there are views */}
            {metrics.views > 0 && (
              <div
                className="text-xs text-gray-400 dark:text-gray-500"
                title="Engagement rate"
              >
                {(
                  ((metrics.comments + metrics.upvotes + metrics.downvotes) /
                    metrics.views) *
                  100
                ).toFixed(1)}
                % engaged
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default ExposeCard;
