/**
 * YouTube Data API를 사용한 비디오 메타데이터 조회
 */

interface VideoMetadata {
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
 * ISO 8601 duration 형식을 초 단위로 변환
 * @example "PT1H2M30S" -> 3750 (1시간 2분 30초)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * YouTube Data API로 비디오 메타데이터 조회
 */
export async function fetchVideoMetadata(
  videoId: string
): Promise<VideoMetadata> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YouTube API key not configured");
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails,statistics&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("VIDEO_NOT_FOUND");
  }

  const item = data.items[0];
  const duration = parseDuration(item.contentDetails.duration);

  return {
    videoId,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    duration,
    viewCount: parseInt(item.statistics.viewCount || "0"),
    likeCount: parseInt(item.statistics.likeCount || "0"),
    thumbnailUrl:
      item.snippet.thumbnails.maxres?.url ||
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.default?.url,
    description: item.snippet.description,
  };
}
