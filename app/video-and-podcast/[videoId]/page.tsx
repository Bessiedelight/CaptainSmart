"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { YouTubeVideo } from "../../../lib/types/youtube";
import { YouTubeService } from "../../../lib/services/youtube";
import VideoandpodcastNavClean from "../../../components/VideoandpodcastNavClean";

interface VideoWithStats extends YouTubeVideo {
  viewCount?: string;
}

const VideoDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const videoId = params.videoId as string;

  const [currentVideo, setCurrentVideo] = useState<VideoWithStats | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all channel videos to find the current one and get related videos
        const searchResponse = await YouTubeService.searchChannelVideos(
          undefined,
          50
        );

        // Find the current video
        const video = searchResponse.items.find(
          (v) => v.id.videoId === videoId
        );

        if (!video) {
          setError("Video not found");
          return;
        }

        // Get video statistics
        const videoIds = searchResponse.items.map((v) => v.id.videoId);
        const statsResponse = await YouTubeService.getVideoDetails(videoIds);

        // Add stats to current video
        const currentVideoStats = statsResponse.items.find(
          (stat) => stat.id === videoId
        );
        const videoWithStats: VideoWithStats = {
          ...video,
          viewCount: currentVideoStats?.statistics.viewCount,
        };

        setCurrentVideo(videoWithStats);

        // Get related videos (exclude current video)
        const related = searchResponse.items
          .filter((v) => v.id.videoId !== videoId)
          .slice(0, 12)
          .map((v) => {
            const stats = statsResponse.items.find(
              (stat) => stat.id === v.id.videoId
            );
            return {
              ...v,
              viewCount: stats?.statistics.viewCount,
            };
          });

        setRelatedVideos(related);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  const handleVideoClick = (clickedVideoId: string) => {
    router.push(`/video-and-podcast/${clickedVideoId}`);
  };

  const handleBackClick = () => {
    router.push("/video-and-podcast");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <VideoandpodcastNavClean />
        <div className="max-w-[1400px] mx-auto px-8 py-16">
          <div className="text-center">
            <div className="inline-block mb-4">
              <svg
                width="40"
                height="36"
                viewBox="0 0 122 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-spin opacity-60"
              >
                <circle cx="60.5" cy="60.5" r="12.5" fill="black" />
                <circle
                  cx="61"
                  cy="61"
                  r="32"
                  stroke="black"
                  strokeWidth="13"
                />
              </svg>
            </div>
            <p className="text-gray-700 text-base">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentVideo) {
    return (
      <div className="min-h-screen bg-white">
        <VideoandpodcastNavClean />
        <div className="max-w-[1400px] mx-auto px-8 py-16">
          <div className="text-center">
            <div className="bg-gray-50 border border-gray-300 rounded-md p-8 max-w-lg mx-auto">
              <div className="text-black mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">
                Video not found
              </h3>
              <p className="text-gray-700 text-sm mb-6">
                {error || "The requested video could not be found."}
              </p>
              <button
                onClick={handleBackClick}
                className="bg-black/70 hover:bg-black/80 text-white px-6 py-2 rounded-sm transition-colors duration-200 text-sm font-medium"
              >
                Back to Videos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Navigation */}
      <VideoandpodcastNavClean />

      {/* Navigation Title Bar */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackClick}
                className="flex items-center text-gray-600 hover:text-black transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Videos & Podcasts
              </button>
              <span className="text-gray-400">/</span>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <h1 className="text-lg font-semibold text-black truncate max-w-md">
                  {currentVideo.snippet.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentVideo.viewCount && (
                <span className="text-sm text-gray-600">
                  {YouTubeService.formatViewCount(currentVideo.viewCount)}
                </span>
              )}
              <button
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/watch?v=${videoId}`,
                    "_blank"
                  )
                }
                className="p-2 text-gray-600 hover:text-black transition-colors duration-200"
                title="Open on YouTube"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-gray-50 rounded-md overflow-hidden border border-gray-300 mb-8">
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title={currentVideo.snippet.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Video Info */}
            <div className="bg-gray-50 rounded-md border border-gray-300 p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-6 leading-tight">
                {currentVideo.snippet.title}
              </h1>

              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-300">
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="font-semibold">
                    {YouTubeService.formatPublishDate(
                      currentVideo.snippet.publishedAt
                    )}
                  </span>
                  {currentVideo.viewCount && (
                    <span className="font-medium">
                      {YouTubeService.formatViewCount(currentVideo.viewCount)}
                    </span>
                  )}
                </div>

                <div className="text-sm text-black font-semibold">
                  {currentVideo.snippet.channelTitle}
                </div>
              </div>

              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-bold text-black mb-4">
                  Description
                </h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {currentVideo.snippet.description ||
                    "No description available."}
                </div>
              </div>
            </div>
          </div>

          {/* Related Videos Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-md border border-gray-300 p-6">
              <h2 className="text-xl font-bold text-black mb-6">More Videos</h2>

              <div className="space-y-6">
                {relatedVideos.map((video) => (
                  <div
                    key={video.id.videoId}
                    onClick={() => handleVideoClick(video.id.videoId)}
                    className="group cursor-pointer border border-gray-200 hover:border-gray-400 rounded-md p-3 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0 w-32 aspect-video bg-gray-100 rounded-sm overflow-hidden">
                        <img
                          src={
                            video.snippet.thumbnails.medium?.url ||
                            video.snippet.thumbnails.default.url
                          }
                          alt={video.snippet.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-black line-clamp-2 group-hover:text-gray-700 transition-colors duration-200 mb-2">
                          {video.snippet.title}
                        </h3>

                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="font-medium">
                            {YouTubeService.formatPublishDate(
                              video.snippet.publishedAt
                            )}
                          </div>
                          {video.viewCount && (
                            <div>
                              {YouTubeService.formatViewCount(video.viewCount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
