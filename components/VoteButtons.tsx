"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VoteButtonsProps {
  exposeId: string;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  onVote: (exposeId: string, voteType: "upvote" | "downvote") => Promise<void>;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
}

export default function VoteButtons({
  exposeId,
  upvotes,
  downvotes,
  netVotes,
  onVote,
  disabled = false,
  size = "md",
  variant = "default",
}: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [optimisticVotes, setOptimisticVotes] = useState({
    upvotes,
    downvotes,
    netVotes,
  });

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (isVoting || disabled) return;

    setIsVoting(true);

    // Store original votes for potential revert
    const originalVotes = { upvotes, downvotes, netVotes };

    // Optimistic update
    const newOptimisticVotes = {
      upvotes:
        voteType === "upvote"
          ? optimisticVotes.upvotes + 1
          : optimisticVotes.upvotes,
      downvotes:
        voteType === "downvote"
          ? optimisticVotes.downvotes + 1
          : optimisticVotes.downvotes,
      netVotes:
        voteType === "upvote"
          ? optimisticVotes.netVotes + 1
          : optimisticVotes.netVotes - 1,
    };
    setOptimisticVotes(newOptimisticVotes);

    try {
      await onVote(exposeId, voteType);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticVotes(originalVotes);
      console.error("Vote failed:", error);

      // Show user-friendly error message
      let errorMessage = "Failed to vote";

      if (error instanceof Error) {
        try {
          const parsedError = JSON.parse(error.message);
          switch (parsedError.code) {
            case "EXPOSE_NOT_FOUND_OR_EXPIRED":
            case "EXPOSE_EXPIRED_DURING_VOTE":
              errorMessage = "This content has expired";
              break;
            case "VOTE_TIMEOUT":
            case "TIMEOUT_ERROR":
              errorMessage = "Vote timed out, please try again";
              break;
            case "NETWORK_ERROR":
            case "DATABASE_CONNECTION_ERROR":
              errorMessage = "Connection error, please try again";
              break;
            default:
              errorMessage = parsedError.message || "Failed to vote";
          }
        } catch {
          errorMessage = error.message || "Failed to vote";
        }
      }

      // You could show a toast notification here or emit an event
      // For now, we'll just log it - the parent component can handle UI feedback
      console.warn("Vote error for user:", errorMessage);
    } finally {
      setIsVoting(false);
    }
  };

  // Update optimistic votes when props change (from successful API response)
  if (
    upvotes !== optimisticVotes.upvotes ||
    downvotes !== optimisticVotes.downvotes
  ) {
    setOptimisticVotes({ upvotes, downvotes, netVotes });
  }

  const sizeClasses = {
    sm: {
      button: "p-1",
      icon: "w-3 h-3",
      text: "text-xs",
    },
    md: {
      button: "p-2",
      icon: "w-4 h-4",
      text: "text-sm",
    },
    lg: {
      button: "p-3",
      icon: "w-5 h-5",
      text: "text-base",
    },
  };

  const currentSize = sizeClasses[size];

  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleVote("upvote")}
          disabled={isVoting || disabled}
          className={`
            ${currentSize.button} ${currentSize.text}
            flex items-center space-x-1
            text-green-600 hover:text-green-700 hover:bg-green-50
            dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20
            rounded-md transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isVoting ? "animate-pulse" : ""}
          `}
          aria-label="Upvote"
        >
          <ChevronUp className={currentSize.icon} />
          <span className="font-medium">{optimisticVotes.upvotes}</span>
        </button>

        <button
          onClick={() => handleVote("downvote")}
          disabled={isVoting || disabled}
          className={`
            ${currentSize.button} ${currentSize.text}
            flex items-center space-x-1
            text-red-600 hover:text-red-700 hover:bg-red-50
            dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20
            rounded-md transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isVoting ? "animate-pulse" : ""}
          `}
          aria-label="Downvote"
        >
          <ChevronDown className={currentSize.icon} />
          <span className="font-medium">{optimisticVotes.downvotes}</span>
        </button>

        <div
          className={`${currentSize.text} text-gray-500 dark:text-gray-400 font-medium`}
        >
          Net: {optimisticVotes.netVotes > 0 ? "+" : ""}
          {optimisticVotes.netVotes}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleVote("upvote")}
          disabled={isVoting || disabled}
          className={`
            ${currentSize.button}
            flex items-center space-x-2
            text-green-600 hover:text-green-700 hover:bg-green-50
            dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20
            rounded-lg border border-green-200 dark:border-green-800
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isVoting ? "animate-pulse" : "hover:scale-105"}
          `}
          aria-label="Upvote"
        >
          <ChevronUp className={currentSize.icon} />
          <span className={`${currentSize.text} font-medium`}>
            {optimisticVotes.upvotes}
          </span>
        </button>

        <button
          onClick={() => handleVote("downvote")}
          disabled={isVoting || disabled}
          className={`
            ${currentSize.button}
            flex items-center space-x-2
            text-red-600 hover:text-red-700 hover:bg-red-50
            dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20
            rounded-lg border border-red-200 dark:border-red-800
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isVoting ? "animate-pulse" : "hover:scale-105"}
          `}
          aria-label="Downvote"
        >
          <ChevronDown className={currentSize.icon} />
          <span className={`${currentSize.text} font-medium`}>
            {optimisticVotes.downvotes}
          </span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span
          className={`${currentSize.text} text-gray-500 dark:text-gray-400`}
        >
          Net:
        </span>
        <span
          className={`
            ${currentSize.text} font-bold
            ${
              optimisticVotes.netVotes > 0
                ? "text-green-600 dark:text-green-400"
                : optimisticVotes.netVotes < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
            }
          `}
        >
          {optimisticVotes.netVotes > 0 ? "+" : ""}
          {optimisticVotes.netVotes}
        </span>
      </div>
    </div>
  );
}
