import {
  YouTubeSearchResponse,
  YouTubeVideoDetailsResponse,
} from "../types/youtube";

const API_KEY = "AIzaSyCuk1ETTONSV63pqlIjupzJEyhDyJWVCcc";
const CHANNEL_ID = "UCoPWWHrj2ND7LnJblMDKBRg";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export class YouTubeService {
  static async searchChannelVideos(
    pageToken?: string,
    maxResults: number = 12
  ): Promise<YouTubeSearchResponse> {
    const params = new URLSearchParams({
      part: "snippet",
      channelId: CHANNEL_ID,
      key: API_KEY,
      order: "date",
      type: "video",
      maxResults: maxResults.toString(),
    });

    if (pageToken) {
      params.append("pageToken", pageToken);
    }

    const response = await fetch(`${BASE_URL}/search?${params}`);

    if (!response.ok) {
      throw new Error(
        `YouTube API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  static async getVideoDetails(
    videoIds: string[]
  ): Promise<YouTubeVideoDetailsResponse> {
    const params = new URLSearchParams({
      part: "statistics",
      id: videoIds.join(","),
      key: API_KEY,
    });

    const response = await fetch(`${BASE_URL}/videos?${params}`);

    if (!response.ok) {
      throw new Error(
        `YouTube API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  static formatViewCount(viewCount: string): string {
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  }

  static formatPublishDate(publishedAt: string): string {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}
