/**
 * YouTube 비디오 메타데이터 조회 (YouTube Data API v3 직접 호출)
 */

import { getEnvConfig } from "@/lib/config/env";
import { createLogger } from "@/lib/logger";

const logger = createLogger("YouTubeMetadata");

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string;
  description: string;
}

/**
 * ISO 8601 duration 파싱 (PT1H2M3S → 초)
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * YouTube Data API v3를 통해 메타데이터 조회
 */
export async function fetchVideoMetadata(
  videoId: string
): Promise<VideoMetadata> {
  const config = getEnvConfig();

  logger.debug("메타데이터 요청", { videoId });

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", config.YOUTUBE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    logger.error("YouTube API 오류", {
      videoId,
      status: response.status,
    });

    if (response.status === 404) {
      throw new Error("VIDEO_NOT_FOUND");
    }
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items;

  if (!items || items.length === 0) {
    throw new Error("VIDEO_NOT_FOUND");
  }

  const item = items[0];
  const snippet = item.snippet;
  const contentDetails = item.contentDetails;
  const statistics = item.statistics;

  const metadata: VideoMetadata = {
    videoId,
    title: snippet.title,
    channelName: snippet.channelTitle,
    channelId: snippet.channelId,
    publishedAt: snippet.publishedAt,
    duration: parseDuration(contentDetails.duration),
    viewCount: parseInt(statistics.viewCount || "0", 10),
    likeCount: parseInt(statistics.likeCount || "0", 10),
    thumbnailUrl:
      snippet.thumbnails?.maxres?.url ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.default?.url,
    description: snippet.description?.substring(0, 2000) || "",
  };

  logger.debug("메타데이터 조회 성공", { videoId });

  return metadata;
}
