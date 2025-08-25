"use client";

import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Wifi,
  Server,
  FileX,
  Clock,
  Shield,
  AlertCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface ErrorDisplayProps {
  error: string | Error | null;
  errorCode?: string;
  variant?: "inline" | "card" | "page" | "toast";
  size?: "sm" | "md" | "lg";
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  className?: string;
  title?: string;
  details?: any;
}

export default function ErrorDisplay({
  error,
  errorCode,
  variant = "card",
  size = "md",
  showRetry = true,
  showHome = false,
  onRetry,
  className = "",
  title,
  details,
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  // Get appropriate icon and styling based on error code
  const getErrorInfo = () => {
    switch (errorCode) {
      case "NETWORK_ERROR":
      case "DATABASE_CONNECTION_ERROR":
      case "DATABASE_UNAVAILABLE":
        return {
          icon: Wifi,
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-200 dark:border-orange-800",
          title: title || "Connection Error",
          suggestion: "Check your internet connection and try again.",
        };

      case "FILE_TOO_LARGE":
      case "INVALID_FILE_TYPE":
      case "UPLOAD_ERROR":
        return {
          icon: FileX,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          title: title || "File Upload Error",
          suggestion: "Please check your file size and format.",
        };

      case "VALIDATION_ERROR":
      case "MISSING_REQUIRED_FIELDS":
      case "INVALID_FIELD_TYPES":
        return {
          icon: AlertCircle,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          title: title || "Validation Error",
          suggestion: "Please check your input and try again.",
        };

      case "EXPOSE_NOT_FOUND_OR_EXPIRED":
      case "EXPOSE_EXPIRED_DURING_VOTE":
        return {
          icon: Clock,
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-200 dark:border-purple-800",
          title: title || "Content Expired",
          suggestion: "This content has expired and is no longer available.",
        };

      case "METHOD_NOT_ALLOWED":
      case "PERMISSION_ERROR":
        return {
          icon: Shield,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          title: title || "Access Denied",
          suggestion: "You don't have permission to perform this action.",
        };

      case "DATABASE_ERROR":
      case "INSUFFICIENT_STORAGE":
        return {
          icon: Server,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          title: title || "Server Error",
          suggestion:
            "Our servers are experiencing issues. Please try again later.",
        };

      default:
        return {
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          title: title || "Error",
          suggestion: "Something went wrong. Please try again.",
        };
    }
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "p-3",
      icon: "w-4 h-4",
      title: "text-sm font-medium",
      message: "text-xs",
      button: "px-2 py-1 text-xs",
    },
    md: {
      container: "p-4",
      icon: "w-5 h-5",
      title: "text-base font-medium",
      message: "text-sm",
      button: "px-3 py-2 text-sm",
    },
    lg: {
      container: "p-6",
      icon: "w-6 h-6",
      title: "text-lg font-semibold",
      message: "text-base",
      button: "px-4 py-2 text-base",
    },
  };

  const currentSize = sizeConfig[size];

  // Render based on variant
  switch (variant) {
    case "inline":
      return (
        <div
          className={`flex items-center space-x-2 ${errorInfo.color} ${className}`}
        >
          <Icon className={currentSize.icon} />
          <span className={currentSize.message}>{errorMessage}</span>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      );

    case "toast":
      return (
        <div
          className={`
          flex items-center justify-between space-x-3 
          ${errorInfo.bgColor} ${errorInfo.borderColor} border rounded-lg 
          ${currentSize.container} ${className}
        `}
        >
          <div className="flex items-center space-x-2">
            <Icon className={`${currentSize.icon} ${errorInfo.color}`} />
            <span
              className={`${currentSize.message} text-gray-800 dark:text-gray-200`}
            >
              {errorMessage}
            </span>
          </div>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className={`
                ${currentSize.button} ${errorInfo.color} hover:opacity-80 
                transition-opacity flex items-center space-x-1
              `}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      );

    case "page":
      return (
        <div
          className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 ${className}`}
        >
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div
              className={`${errorInfo.bgColor} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}
            >
              <Icon className={`w-8 h-8 ${errorInfo.color}`} />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {errorInfo.title}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errorMessage}
            </p>

            {errorInfo.suggestion && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                {errorInfo.suggestion}
              </p>
            )}

            {/* Development details */}
            {process.env.NODE_ENV === "development" && details && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
                  <pre>{JSON.stringify(details, null, 2)}</pre>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              )}

              {showHome && (
                <Link
                  href="/"
                  className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      );

    case "card":
    default:
      return (
        <div
          className={`
          ${errorInfo.bgColor} ${errorInfo.borderColor} border rounded-lg 
          ${currentSize.container} ${className}
        `}
        >
          <div className="flex items-start space-x-3">
            <Icon className={`${currentSize.icon} ${errorInfo.color} mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h3
                className={`${currentSize.title} text-gray-900 dark:text-white`}
              >
                {errorInfo.title}
              </h3>
              <p
                className={`${currentSize.message} text-gray-700 dark:text-gray-300 mt-1`}
              >
                {errorMessage}
              </p>
              {errorInfo.suggestion && (
                <p
                  className={`${currentSize.message} text-gray-600 dark:text-gray-400 mt-2`}
                >
                  {errorInfo.suggestion}
                </p>
              )}

              {/* Development details */}
              {process.env.NODE_ENV === "development" && details && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                    Error Details (Development)
                  </summary>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 mt-2 text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-24">
                    <pre>{JSON.stringify(details, null, 2)}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>

          {(showRetry || showHome) && (
            <div className="flex items-center space-x-3 mt-4">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className={`
                    ${currentSize.button} ${errorInfo.color} hover:opacity-80 
                    transition-opacity flex items-center space-x-1 underline
                  `}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Try again</span>
                </button>
              )}

              {showHome && (
                <Link
                  href="/"
                  className={`
                    ${currentSize.button} text-gray-600 dark:text-gray-400 
                    hover:text-gray-800 dark:hover:text-gray-200 
                    transition-colors flex items-center space-x-1 underline
                  `}
                >
                  <Home className="w-3 h-3" />
                  <span>Go home</span>
                </Link>
              )}
            </div>
          )}
        </div>
      );
  }
}

// Specialized error components for common scenarios
export function NetworkErrorDisplay({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      error="Unable to connect to the server"
      errorCode="NETWORK_ERROR"
      variant="card"
      showRetry={true}
      onRetry={onRetry}
      className={className}
    />
  );
}

export function ValidationErrorDisplay({
  errors,
  className,
}: {
  errors: string[] | Record<string, string>;
  className?: string;
}) {
  const errorMessage = Array.isArray(errors)
    ? errors.join(", ")
    : Object.values(errors).join(", ");

  return (
    <ErrorDisplay
      error={errorMessage}
      errorCode="VALIDATION_ERROR"
      variant="card"
      size="sm"
      showRetry={false}
      className={className}
    />
  );
}

export function FileUploadErrorDisplay({
  error,
  onRetry,
  className,
}: {
  error: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      error={error}
      errorCode="UPLOAD_ERROR"
      variant="card"
      size="sm"
      showRetry={true}
      onRetry={onRetry}
      className={className}
    />
  );
}
