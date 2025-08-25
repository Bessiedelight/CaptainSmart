"use client";

import React from "react";

interface LoadingSkeletonProps {
  variant?: "card" | "text" | "avatar" | "button" | "image";
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  variant = "text",
  width,
  height,
  className = "",
  count = 1,
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  const getVariantClasses = () => {
    switch (variant) {
      case "card":
        return "h-48 w-full";
      case "text":
        return "h-4 w-full";
      case "avatar":
        return "h-10 w-10 rounded-full";
      case "button":
        return "h-10 w-24";
      case "image":
        return "h-32 w-full";
      default:
        return "h-4 w-full";
    }
  };

  const skeletonClasses = `${baseClasses} ${getVariantClasses()} ${className}`;
  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  if (count === 1) {
    return <div className={skeletonClasses} style={style} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClasses} style={style} />
      ))}
    </div>
  );
}

// Specific skeleton components for common use cases
export function ExposeCardSkeleton({
  showAudio = false,
}: { showAudio?: boolean } = {}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <LoadingSkeleton variant="button" width="120px" />
          <div className="flex items-center space-x-1">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <LoadingSkeleton variant="text" width="80px" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <LoadingSkeleton variant="text" width="80%" className="mb-2" />
        <LoadingSkeleton variant="text" count={3} className="mb-4" />

        {/* Image placeholder */}
        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>

        {/* Audio placeholder */}
        {showAudio && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              <LoadingSkeleton variant="text" width="120px" />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <LoadingSkeleton variant="text" width="30px" />
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <LoadingSkeleton variant="text" width="30px" />
            </div>
          </div>
          <LoadingSkeleton variant="text" width="60px" />
        </div>
      </div>
    </div>
  );
}

export function ExposeFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title field */}
      <div>
        <LoadingSkeleton variant="text" width="60px" className="mb-2" />
        <LoadingSkeleton variant="text" height="40px" />
      </div>

      {/* Description field */}
      <div>
        <LoadingSkeleton variant="text" width="80px" className="mb-2" />
        <LoadingSkeleton variant="card" height="120px" />
      </div>

      {/* Hashtag field */}
      <div>
        <LoadingSkeleton variant="text" width="70px" className="mb-2" />
        <LoadingSkeleton variant="text" height="40px" />
      </div>

      {/* File upload areas */}
      <div>
        <LoadingSkeleton variant="text" width="100px" className="mb-2" />
        <LoadingSkeleton variant="card" height="100px" />
      </div>

      {/* Submit button */}
      <LoadingSkeleton variant="button" width="100%" height="48px" />
    </div>
  );
}

export function ExposeFiltersSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <LoadingSkeleton variant="text" width="120px" />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <LoadingSkeleton variant="button" width="180px" />
          <LoadingSkeleton variant="button" width="160px" />
        </div>
      </div>
    </div>
  );
}
