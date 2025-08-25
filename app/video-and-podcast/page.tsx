"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { YouTubeVideo } from "../../lib/types/youtube";
import { YouTubeService } from "../../lib/services/youtube";
import VideoCard from "../../components/VideoCard";
import VideoandpodcastNav from "../../components/VideoandpodcastNav";

type VideoWithStats = YouTubeVideo & { viewCount?: string };

const VideoAndPodcast: React.FC = () => {
  const [videos, setVideos] = useState<VideoWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<
    "none" | "views-desc" | "views-asc"
  >("none");
  const [minViews, setMinViews] = useState<number | "">("");

  // Refs for animation
  const gridRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

  /**
   * fetchVideos:
   * - If called with isLoadMore === true -> fetch one page (preserves previous load-more flow)
   * - If initial load (no pageToken passed and !isLoadMore) -> iterate all pages and fetch all videos
   */
  const fetchVideos = async (pageToken?: string, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // ---------- LOAD-MORE PATH (page-by-page) ----------
      if (isLoadMore && pageToken) {
        const searchResponse =
          await YouTubeService.searchChannelVideos(pageToken);

        const videoIds = searchResponse.items.map((video) => video.id.videoId);

        // batch stat requests (50 per request)
        const statsBatches: any[] = [];
        for (let i = 0; i < videoIds.length; i += 50) {
          const batchIds = videoIds.slice(i, i + 50);
          const statsResp = await YouTubeService.getVideoDetails(batchIds);
          statsBatches.push(...statsResp.items);
        }

        const videosWithStats: VideoWithStats[] = searchResponse.items.map(
          (video) => {
            const stats = statsBatches.find(
              (stat) => stat.id === video.id.videoId
            );
            return {
              ...video,
              viewCount: stats?.statistics?.viewCount,
            };
          }
        );

        setVideos((prev) => [...prev, ...videosWithStats]);
        setNextPageToken(searchResponse.nextPageToken);
        setHasMore(!!searchResponse.nextPageToken);
        return;
      }

      // ---------- INITIAL FETCH PATH (limit to 20 videos) ----------
      let allItems: any[] = [];
      let token: string | undefined = pageToken;
      const maxVideos = 20;

      do {
        const resp = await YouTubeService.searchChannelVideos(token);
        const newItems = resp.items || [];

        // Add items but don't exceed maxVideos
        const remainingSlots = maxVideos - allItems.length;
        if (remainingSlots <= 0) break;

        allItems.push(...newItems.slice(0, remainingSlots));
        token = resp.nextPageToken;

        // Stop if we've reached our limit
        if (allItems.length >= maxVideos) break;
      } while (token);

      if (allItems.length === 0) {
        setVideos([]);
        setNextPageToken(undefined);
        setHasMore(false);
        return;
      }

      // Collect all video IDs and request stats in batches (50)
      const allVideoIds = allItems.map((v) => v.id.videoId).filter(Boolean);

      const allStats: any[] = [];
      for (let i = 0; i < allVideoIds.length; i += 50) {
        const batch = allVideoIds.slice(i, i + 50);
        const statsResp = await YouTubeService.getVideoDetails(batch);
        allStats.push(...(statsResp.items || []));
      }

      // Combine
      const videosWithStats: VideoWithStats[] = allItems.map((video) => {
        const stats = allStats.find((s) => s.id === video.id.videoId);
        return {
          ...video,
          viewCount: stats?.statistics?.viewCount,
        };
      });

      setVideos(videosWithStats);
      setNextPageToken(undefined);
      setHasMore(false);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // initial load: fetch ALL videos
  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    if (nextPageToken && !loadingMore) {
      fetchVideos(nextPageToken, true);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchVideos();
  };

  // Filtering + sorting (client-side)
  const filteredAndSortedVideos = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let list = videos.filter((v) => {
      // Search: look in title and description
      const title = (v.snippet?.title || "").toLowerCase();
      const desc = (v.snippet?.description || "").toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        desc.includes(normalizedSearch);

      // Min views filter
      const viewsNum = parseInt(v.viewCount || "0", 10);
      const meetsMinViews =
        minViews === "" ? true : viewsNum >= Number(minViews);

      return matchesSearch && meetsMinViews;
    });

    if (sortOption === "views-desc") {
      list = list.sort(
        (a, b) =>
          parseInt(b.viewCount || "0", 10) - parseInt(a.viewCount || "0", 10)
      );
    } else if (sortOption === "views-asc") {
      list = list.sort(
        (a, b) =>
          parseInt(a.viewCount || "0", 10) - parseInt(b.viewCount || "0", 10)
      );
    }

    return list;
  }, [videos, searchTerm, sortOption, minViews]);

  // Animate grid items when filtered list changes or on initial load
  useEffect(() => {
    // keep refs in sync with list length
    itemsRef.current = itemsRef.current.slice(
      0,
      filteredAndSortedVideos.length
    );

    // small timeout to ensure DOM updated
    const id = setTimeout(() => {
      if (!gridRef.current) return;

      // kill previous tweens on items
      gsap.killTweensOf(itemsRef.current);

      gsap.fromTo(
        itemsRef.current,
        { y: 10, opacity: 0, scale: 0.995 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          stagger: 0.04,
          ease: "power2.out",
        }
      );
    }, 50);

    return () => clearTimeout(id);
  }, [filteredAndSortedVideos.length]);

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black">
        {/* Main Navigation */}
        <VideoandpodcastNav />

        <div className="max-w-[1400px] mx-auto px-8 py-16">
          <main className="w-full">
            <div className="grid grid-cols-3 gap-12 mb-20">
              {/* Skeleton Cards */}
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-md overflow-hidden border border-gray-300 animate-pulse"
                >
                  {/* Skeleton Thumbnail */}
                  <div className="aspect-video bg-gray-200"></div>

                  {/* Skeleton Content */}
                  <div className="p-6">
                    {/* Skeleton Title */}
                    <div className="space-y-2 mb-4">
                      <div className="h-5 bg-gray-200 rounded w-full"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    </div>

                    {/* Skeleton Meta */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>

                    {/* Skeleton Description */}
                    <div className="space-y-2 mb-8">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>

                    {/* Skeleton Button */}
                    <div className="h-12 bg-gray-200 rounded-sm w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-[1600px] mx-auto px-8 py-12">
          <div className="text-center">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-lg mx-auto shadow-sm">
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
                Unable to load videos
              </h3>
              <p className="text-gray-700 text-sm mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-md transition-colors duration-200 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Main Navigation */}
      <VideoandpodcastNav />

      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <main className="w-full">
          <div ref={gridRef} className="grid grid-cols-3 gap-12 mb-20">
            {filteredAndSortedVideos.map((video, idx) => (
              <div
                key={video.id.videoId}
                ref={(el) => {
                  itemsRef.current[idx] = el;
                }}
                className="video-item"
              >
                <VideoCard video={video} viewCount={video.viewCount} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-md transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center">
                    <svg
                      width="16"
                      height="15"
                      viewBox="0 0 122 120"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="animate-spin opacity-80 mr-2"
                    >
                      <circle cx="60.5" cy="60.5" r="12.5" fill="white" />
                      <circle
                        cx="61"
                        cy="61"
                        r="32"
                        stroke="white"
                        strokeWidth="13"
                      />
                    </svg>
                    Loading more...
                  </span>
                ) : (
                  "Load More Videos"
                )}
              </button>
            </div>
          )}

          {!hasMore && videos.length > 0 && (
            <div className="text-center mt-6">
              <p className="text-gray-600 text-sm">
                You've reached the end of our video collection
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VideoAndPodcast;
