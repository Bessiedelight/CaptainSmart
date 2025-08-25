import { NextRequest, NextResponse } from "next/server";
import { YouTubeService } from "../../../lib/services/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get("pagetoken") || undefined;
    const maxResults = parseInt(searchParams.get("maxResults") || "12");

    // Fetch videos from channel
    const searchResponse = await YouTubeService.searchChannelVideos(
      pageToken,
      maxResults
    );

    // Extract video IDs for statistics
    const videoIds = searchResponse.items.map((video) => video.id.videoId);

    // Fetch video statistics
    const statsResponse = await YouTubeService.getVideoDetails(videoIds);

    // Combine video data with statistics
    const videosWithStats = searchResponse.items.map((video) => {
      const stats = statsResponse.items.find(
        (stat) => stat.id === video.id.videoId
      );
      return {
        ...video,
        viewCount: stats?.statistics.viewCount,
        statistics: stats?.statistics,
      };
    });

    return NextResponse.json({
      items: videosWithStats,
      nextPageToken: searchResponse.nextPageToken,
      pageInfo: searchResponse.pageInfo,
    });
  } catch (error) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
