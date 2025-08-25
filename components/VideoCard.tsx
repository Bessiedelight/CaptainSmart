"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { YouTubeVideo } from "../lib/types/youtube";
import { YouTubeService } from "../lib/services/youtube";

interface VideoCardProps {
  video: YouTubeVideo;
  viewCount?: string;
  showFullVideo?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  viewCount,
  showFullVideo = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const handlePlayClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying((s) => !s);
  };

  const handleViewFullVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/video-and-podcast/${video.id.videoId}`);
  };

  const getThumbnailUrl = () => {
    const thumbnails = video.snippet.thumbnails || {};

    if (imageError) {
      return thumbnails.default?.url || "";
    }

    return (
      thumbnails.maxres?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      ""
    );
  };

  const truncateDescription = (text: string, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <div
      className="group bg-gray-50 cursor-pointer flex flex-col h-full transition-all duration-300 hover:shadow-lg rounded-md overflow-hidden border border-gray-300"
      onClick={() => setIsPlaying(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") setIsPlaying(true);
      }}
    >
      {/* Video Thumbnail Container */}
      <div className="relative aspect-video bg-white">
        {!isPlaying ? (
          <>
            {getThumbnailUrl() ? (
              <img
                src={getThumbnailUrl()}
                alt={video.snippet.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <svg
                  className="w-12 h-12 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}

            {/* Subtle hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200" />

            {/* Minimalist play button */}
            <button
              onClick={handlePlayClick}
              aria-label="Play video"
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="bg-white/95 backdrop-blur-sm p-3 shadow-lg">
                  <svg
                    className="w-6 h-6 text-black ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          </>
        ) : (
          <div className="relative w-full h-full bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1&rel=0`}
              title={video.snippet.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={handlePlayClick}
              className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-black p-2 hover:bg-white transition-colors"
              aria-label="Close video"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-6">
        {/* Title */}
        <h3 className="font-semibold text-black text-xl leading-tight mb-4 line-clamp-2 tracking-tight">
          {video.snippet.title}
        </h3>

        {/* Meta Information */}
        <div className="flex items-center text-sm text-gray-500 mb-4 font-medium">
          <span>
            {YouTubeService.formatPublishDate(video.snippet.publishedAt)}
          </span>
          {viewCount && (
            <>
              <span className="mx-2 text-gray-300">•</span>
              <span>{YouTubeService.formatViewCount(viewCount)}</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-8">
          {truncateDescription(video.snippet.description)}
        </p>

        {/* View Full Video Button */}
        {showFullVideo && (
          <button
            onClick={handleViewFullVideo}
            className="w-full bg-black/70 text-white py-4 text-sm font-semibold hover:bg-black/80 transition-colors duration-200 rounded-sm"
            aria-label="View full video"
          >
            View Full Video
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
