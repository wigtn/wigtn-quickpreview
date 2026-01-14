import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getEnvConfig } from "./config/env";
import { createLogger } from "./logger";
import { YOUTUBE, AUDIO } from "./constants";

const execFileAsync = promisify(execFile);
const logger = createLogger("YouTubeAudio");

function validateVideoId(videoId: string): void {
  const videoIdPattern = YOUTUBE.VIDEO_ID_PATTERN;
  if (!videoIdPattern.test(videoId)) {
    throw new Error(`Invalid YouTube video ID format: ${videoId}`);
  }
}

export async function downloadAudio(videoId: string): Promise<Buffer> {
  // videoId validation으로 command injection 방지
  validateVideoId(videoId);

  const config = getEnvConfig();
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const tempDir = os.tmpdir();
  const outputPath = path.join(tempDir, `${videoId}-audio.webm`);

  try {
    // execFile을 사용하여 command injection 방지 (쉘을 거치지 않음)
    const args = [
      "-f",
      "bestaudio[ext=webm]/bestaudio",
      "-o",
      outputPath,
      "--no-playlist",
      url,
    ];

    logger.info("yt-dlp 실행", { path: config.YT_DLP_PATH, args });
    await execFileAsync(config.YT_DLP_PATH, args, {
      timeout: AUDIO.DOWNLOAD_TIMEOUT,
    });

    // 파일 읽기
    const audioBuffer = fs.readFileSync(outputPath);

    // 임시 파일 삭제
    fs.unlinkSync(outputPath);

    return audioBuffer;
  } catch (error) {
    // 임시 파일 정리
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw error;
  }
}

export function getVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
