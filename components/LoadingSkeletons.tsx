"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface CommentSkeletonProps {
  count?: number;
  animated?: boolean;
}

export function CommentSkeleton({
  count = 3,
  animated = true,
}: CommentSkeletonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated && containerRef.current) {
      const items = containerRef.current.children;

      // Animate skeleton items with staggered entrance
      gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
        }
      );

      // Add shimmer effect to gradient elements
      const gradients =
        containerRef.current.querySelectorAll(".shimmer-gradient");
      gradients.forEach((gradient) => {
        gsap.to(gradient, {
          backgroundPosition: "200% 0",
          duration: 1.5,
          repeat: -1,
          ease: "none",
        });
      });
    }
  }, [animated]);

  return (
    <div ref={containerRef} className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex space-x-3 opacity-0">
          {/* Avatar skeleton */}
          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
            <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
          </div>

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            {/* Header skeleton */}
            <div className="flex items-center space-x-2">
              <div className="h-4 w-20 bg-gray-200 rounded overflow-hidden">
                <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
              </div>
              <div className="h-4 w-12 bg-gray-200 rounded overflow-hidden">
                <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
              </div>
            </div>

            {/* Comment text skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded overflow-hidden">
                <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
              </div>
              <div className="h-4 w-1/2 bg-gray-200 rounded overflow-hidden">
                <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ExposeCardSkeletonProps {
  animated?: boolean;
}

export function ExposeCardSkeleton({
  animated = true,
}: ExposeCardSkeletonProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated && cardRef.current) {
      // Animate card entrance
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
        }
      );

      // Add shimmer effect to gradient elements
      const gradients = cardRef.current.querySelectorAll(".shimmer-gradient");
      gradients.forEach((gradient) => {
        gsap.to(gradient, {
          backgroundPosition: "200% 0",
          duration: 1.5,
          repeat: -1,
          ease: "none",
        });
      });
    }
  }, [animated]);

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden opacity-0"
    >
      {/* Header skeleton */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
          </div>
          <div className="h-4 w-16 bg-gray-200 rounded overflow-hidden">
            <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title skeleton */}
        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full bg-gray-200 rounded overflow-hidden">
            <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
          </div>
          <div className="h-4 w-2/3 bg-gray-200 rounded overflow-hidden">
            <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
          </div>
        </div>

        {/* Image skeleton */}
        <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-16 bg-gray-200 rounded overflow-hidden">
              <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded overflow-hidden">
              <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
            </div>
          </div>
          <div className="h-4 w-12 bg-gray-200 rounded overflow-hidden">
            <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricsSkeletonProps {
  animated?: boolean;
}

export function MetricsSkeleton({ animated = true }: MetricsSkeletonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animated && containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: "back.out(1.7)",
        }
      );

      // Add shimmer effect
      const gradients =
        containerRef.current.querySelectorAll(".shimmer-gradient");
      gradients.forEach((gradient) => {
        gsap.to(gradient, {
          backgroundPosition: "200% 0",
          duration: 1.5,
          repeat: -1,
          ease: "none",
        });
      });
    }
  }, [animated]);

  return (
    <div ref={containerRef} className="flex items-center space-x-4">
      {/* View count skeleton */}
      <div className="flex items-center space-x-1 opacity-0">
        <div className="w-4 h-4 bg-gray-200 rounded overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>
        <div className="h-4 w-8 bg-gray-200 rounded overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>
      </div>

      {/* Comment count skeleton */}
      <div className="flex items-center space-x-1 opacity-0">
        <div className="w-4 h-4 bg-gray-200 rounded overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>
        <div className="h-4 w-6 bg-gray-200 rounded overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>
      </div>

      {/* Share count skeleton */}
      <div className="flex items-center space-x-1 opacity-0">
        <div className="w-4 h-4 bg-gray-200 rounded overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded overflow-hidden">
          <div className="w-full h-full shimmer-gradient bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
        </div>
      </div>
    </div>
  );
}
