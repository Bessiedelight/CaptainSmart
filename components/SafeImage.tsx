"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  category?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  fill,
  category = "General",
}) => {
  const getFallbackImage = (category: string): string => {
    const fallbacks = {
      Politics:
        "https://images.pexels.com/photos/1108117/pexels-photo-1108117.jpeg?auto=compress&cs=tinysrgb&w=800",
      Sports:
        "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800",
      Business:
        "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
      Entertainment:
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800",
      General:
        "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800",
    };
    return fallbacks[category as keyof typeof fallbacks] || fallbacks.General;
  };

  // Validate and sanitize the initial src
  const getValidSrc = (originalSrc: string): string => {
    if (!originalSrc || originalSrc.trim() === "") {
      return getFallbackImage(category);
    }

    // Check if it's a valid URL
    try {
      new URL(originalSrc);
      return originalSrc;
    } catch {
      // If not a valid URL, return fallback
      return getFallbackImage(category);
    }
  };

  const [imgSrc, setImgSrc] = useState(() => getValidSrc(src));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Reset states when src changes
  useEffect(() => {
    setImgSrc(getValidSrc(src));
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [src, category]);

  const handleError = () => {
    setIsLoading(false);

    if (retryCount < 2) {
      console.log(
        `Image failed to load (attempt ${retryCount + 1}): ${imgSrc}`
      );
      setRetryCount((prev) => prev + 1);

      // If it's a citinewsroom image and first retry, try the proxy
      if (
        retryCount === 0 &&
        src.includes("citinewsroom.com") &&
        !imgSrc.includes("/api/image-proxy")
      ) {
        console.log("Trying image proxy for citinewsroom image");
        setImgSrc(`/api/image-proxy?url=${encodeURIComponent(src)}`);
        setIsLoading(true);
      } else {
        // Use fallback image
        console.log("Switching to fallback image");
        setImgSrc(getFallbackImage(category));
        setIsLoading(true);
      }
    } else {
      // Final fallback - ensure we have a working image
      setHasError(true);
      if (imgSrc !== getFallbackImage(category)) {
        setImgSrc(getFallbackImage(category));
        setIsLoading(true);
      }
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Use the LoadingSkeleton component for better UX

  // Render loading state
  if (isLoading && !hasError) {
    return (
      <div className="relative">
        <LoadingSkeleton variant="image" className={className} />
        <div className="absolute inset-0 opacity-0">
          <Image
            src={imgSrc}
            alt={alt || "News image"}
            className={className}
            onError={handleError}
            onLoad={handleLoad}
            unoptimized={
              imgSrc.includes("citinewsroom.com") ||
              imgSrc.includes("pexels.com")
            }
            {...(fill
              ? { fill: true }
              : { width: width || 400, height: height || 300 })}
          />
        </div>
      </div>
    );
  }

  // Main image render
  try {
    const imageProps = {
      src: imgSrc,
      alt: alt || "News image",
      className,
      onError: handleError,
      onLoad: handleLoad,
      unoptimized:
        imgSrc.includes("citinewsroom.com") || imgSrc.includes("pexels.com"),
      priority: false,
      ...(fill
        ? { fill: true }
        : { width: width || 400, height: height || 300 }),
    };

    return <Image {...imageProps} />;
  } catch (error) {
    console.error("Error rendering Next.js Image:", error);
    // Ultimate fallback to regular img tag
    return (
      <img
        src={getFallbackImage(category)}
        alt={alt || "News image"}
        className={className}
        style={{
          width: fill ? "100%" : width || 400,
          height: fill ? "100%" : height || 300,
          objectFit: "cover",
        }}
        onLoad={handleLoad}
      />
    );
  }
};

export default SafeImage;
