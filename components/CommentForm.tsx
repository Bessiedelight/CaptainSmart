"use client";

import { useState, useRef, useCallback } from "react";
import { Send, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { gsap } from "gsap";
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

interface CommentFormProps {
  exposeId: string;
  onCommentSubmitAction: (comment: Comment) => void;
  onCommentCountChange?: (newCount: number) => void;
}

interface SubmitResponse {
  success: boolean;
  data?: {
    comment: Comment;
    message: string;
  };
  error?: string;
  code?: string;
  details?: any;
}

export default function CommentForm({
  exposeId,
  onCommentSubmitAction,
  onCommentCountChange,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const MAX_CHARS = 500;
  const MIN_CHARS = 1;

  // Handle content change with validation
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      setCharCount(newContent.length);

      // Clear previous messages when user starts typing
      if (error) setError(null);
      if (success) setSuccess(null);
    },
    [error, success]
  );

  // Validate form input
  const validateInput = useCallback(() => {
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      return "Comment cannot be empty or only whitespace";
    }

    if (trimmedContent.length < MIN_CHARS) {
      return `Comment must be at least ${MIN_CHARS} character${MIN_CHARS > 1 ? "s" : ""}`;
    }

    if (trimmedContent.length > MAX_CHARS) {
      return `Comment must be ${MAX_CHARS} characters or less`;
    }

    return null;
  }, [content]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate input
      const validationError = validateInput();
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const trimmedContent = content.trim();

        // Create optimistic comment for immediate UI update
        const optimisticComment: Comment = {
          _id: `temp_${Date.now()}`,
          commentId: `temp_comment_${Date.now()}`,
          exposeId,
          content: trimmedContent,
          anonymousId: "temp_anonymous",
          timeAgo: "now",
          createdAt: new Date().toISOString(),
        };

        // Optimistically update UI
        onCommentSubmitAction(optimisticComment);

        // Clear form immediately for better UX
        setContent("");
        setCharCount(0);

        // Submit to API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch("/api/expose/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exposeId,
            content: trimmedContent,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data: SubmitResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || `Server error (${response.status})`);
        }

        // Show success message with optimized animation
        setSuccess(data.data?.message || "Comment submitted successfully!");

        // Animate success feedback with performance monitoring
        if (submitButtonRef.current) {
          UIAnimations.animateButton(submitButtonRef.current, "success");
        }

        // Update with real comment data (replace optimistic comment)
        if (data.data?.comment) {
          onCommentSubmitAction(data.data.comment);

          // Notify parent about comment count change
          if (onCommentCountChange) {
            // We don't know the exact count, so we'll let the parent handle it
            // The parent should refresh or increment their count
            onCommentCountChange(-1); // Signal that a comment was added
          }
        }

        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);

        // Focus back to textarea for potential next comment with smooth animation
        if (textareaRef.current) {
          UIAnimations.animateButton(textareaRef.current, "hover", {
            onComplete: () => textareaRef.current?.focus(),
          });
        }
      } catch (err) {
        console.error("Error submitting comment:", err);

        // Restore form content on error
        setContent(content);
        setCharCount(content.length);

        // Handle different error types
        let errorMessage = "Failed to submit comment";
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage = "Request timed out. Please try again.";
          } else if (err.message.includes("Failed to fetch")) {
            errorMessage = "Network error. Please check your connection.";
          } else if (err.message.includes("Too many comments")) {
            errorMessage =
              "Too many comments submitted recently. Please wait before commenting again.";
          } else if (err.message.includes("Rate limit")) {
            errorMessage = "Please wait before submitting another comment.";
          } else if (err.message.includes("expired")) {
            errorMessage =
              "This post has expired and no longer accepts comments.";
          } else if (err.message.includes("Server error")) {
            errorMessage = "Server temporarily unavailable. Please try again.";
          }
        }

        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [content, exposeId, onCommentSubmitAction, validateInput]
  );

  // Handle textarea auto-resize
  const handleTextareaResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Auto-resize on content change
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleContentChange(e);
      handleTextareaResize();
    },
    [handleContentChange, handleTextareaResize]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Ctrl/Cmd + Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [handleSubmit]
  );

  // Calculate character count color
  const getCharCountColor = () => {
    const percentage = (charCount / MAX_CHARS) * 100;
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 75) return "text-orange-500";
    return "text-gray-500";
  };

  // Check if form is valid
  const isFormValid =
    content.trim().length >= MIN_CHARS && charCount <= MAX_CHARS;

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      <form ref={formRef} onSubmit={handleSubmit} className="p-4">
        {/* Form Header */}
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-900">Add a comment</h3>
          <p className="text-xs text-gray-500 mt-1">
            Share your thoughts anonymously. Press Ctrl+Enter to submit quickly.
          </p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="What are your thoughts on this?"
            className={`w-full p-3 border rounded-lg resize-none transition-all duration-200 focus:outline-none focus:ring-2 min-h-[80px] max-h-[200px] ${
              error
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
            disabled={isSubmitting}
            maxLength={MAX_CHARS}
            rows={3}
          />

          {/* Character Counter */}
          <div className="absolute bottom-2 right-2">
            <span className={`text-xs ${getCharCountColor()}`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Comments are anonymous and cannot be edited or deleted.
          </div>

          <button
            ref={submitButtonRef}
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              !isFormValid || isSubmitting
                ? "bg-gray-200 text-gray-500 cursor-not-allowed scale-100"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>

        {/* Form Guidelines */}
        <div className="mt-3 text-xs text-gray-400 space-y-1">
          <div>• Be respectful and constructive in your comments</div>
          <div>• Comments are public and visible to all users</div>
          <div>• Spam or inappropriate content may be removed</div>
        </div>
      </form>
    </div>
  );
}
