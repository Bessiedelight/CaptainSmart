"use client";

import React from "react";

// Base skeleton component with simple animation
const SkeletonBase: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

// Smart News Skeleton
export const SmartNewsPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Navigation skeleton */}
    <div className="h-16 bg-gray-100 border-b border-gray-200" />

    {/* Sub-route navigation skeleton */}
    <div className="bg-gray-50 border-b border-gray-200 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-4 rounded border">
              <SkeletonBase className="h-4 w-20 mb-2" />
              <SkeletonBase className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero article */}
          <div className="space-y-4">
            <SkeletonBase className="h-8 w-3/4" />
            <SkeletonBase className="h-4 w-full" />
            <SkeletonBase className="h-4 w-2/3" />
            <SkeletonBase className="h-48 w-full" />
          </div>

          {/* Article grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <SkeletonBase className="h-32 w-full" />
                <SkeletonBase className="h-5 w-full" />
                <SkeletonBase className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <SkeletonBase className="h-24 w-full" />
              <SkeletonBase className="h-4 w-full" />
              <SkeletonBase className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Expose Corner Skeleton
export const ExposeCornerPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Navigation skeleton */}
    <div className="h-16 bg-gray-100 border-b border-gray-200" />

    {/* Header skeleton */}
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
        <SkeletonBase className="h-6 w-32" />
        <div className="flex space-x-3">
          <SkeletonBase className="h-8 w-8 rounded-full" />
          <SkeletonBase className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>

    {/* Tabs skeleton */}
    <div className="max-w-4xl mx-auto border-b border-gray-200">
      <div className="flex">
        <SkeletonBase className="flex-1 h-12" />
        <SkeletonBase className="flex-1 h-12" />
      </div>
    </div>

    {/* Feed skeleton */}
    <div className="max-w-4xl mx-auto">
      {/* Compose area */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex space-x-3">
          <SkeletonBase className="w-10 h-10 rounded-full" />
          <SkeletonBase className="flex-1 h-12 rounded-lg" />
        </div>
      </div>

      {/* Posts skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border-b border-gray-200 p-4">
          <div className="flex space-x-3">
            <SkeletonBase className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="flex space-x-2">
                <SkeletonBase className="h-4 w-20" />
                <SkeletonBase className="h-4 w-16" />
                <SkeletonBase className="h-4 w-12" />
              </div>
              <SkeletonBase className="h-5 w-3/4" />
              <SkeletonBase className="h-4 w-full" />
              <SkeletonBase className="h-4 w-2/3" />
              <SkeletonBase className="h-32 w-full rounded-lg" />
              <div className="flex space-x-6">
                {[1, 2, 3, 4].map((j) => (
                  <SkeletonBase key={j} className="h-4 w-8" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Store Skeleton
export const StorePageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Navigation skeleton */}
    <div className="h-16 bg-gray-100 border-b border-gray-200" />

    {/* Header skeleton */}
    <div className="border-b border-gray-200 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <SkeletonBase className="h-4 w-24 mb-6" />
        <SkeletonBase className="h-12 w-96 mb-8" />

        {/* Category tabs */}
        <div className="flex space-x-4 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBase key={i} className="h-10 w-24 rounded flex-shrink-0" />
          ))}
        </div>
      </div>
    </div>

    {/* Product grid skeleton */}
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="border border-gray-200 rounded overflow-hidden"
          >
            <SkeletonBase className="aspect-square w-full" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <SkeletonBase className="h-5 w-2/3" />
                <SkeletonBase className="h-5 w-16" />
              </div>
              <SkeletonBase className="h-4 w-full" />
              <SkeletonBase className="h-4 w-3/4" />
              <div className="flex justify-between items-center pt-2">
                <SkeletonBase className="h-6 w-16" />
                <SkeletonBase className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Video & Podcast Skeleton
export const VideoAndPodcastPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Navigation skeleton */}
    <div className="h-16 bg-gray-100 border-b border-gray-200" />

    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Video grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div
            key={i}
            className="bg-gray-50 rounded border border-gray-200 overflow-hidden"
          >
            {/* Video thumbnail */}
            <SkeletonBase className="aspect-video w-full" />

            {/* Video content */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <SkeletonBase className="h-5 w-full" />
                <SkeletonBase className="h-5 w-3/4" />
              </div>

              {/* Meta info */}
              <div className="flex space-x-4">
                <SkeletonBase className="h-3 w-20" />
                <SkeletonBase className="h-3 w-16" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <SkeletonBase className="h-3 w-full" />
                <SkeletonBase className="h-3 w-full" />
                <SkeletonBase className="h-3 w-2/3" />
              </div>

              {/* Button */}
              <SkeletonBase className="h-12 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
