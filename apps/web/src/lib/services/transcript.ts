/**
 * 비디오 자막 추출 서비스
 * YouTube 자막 우선, STT fallback 방식 사용
 */

import { downloadAudio } from "@/lib/youtube-audio";
import { transcribeAudio, isWithinSTTLimit, STTSegment } from "@/lib/stt";
import { createLogger } from "@/lib/logger";
import { TRANSCRIPT } from "@/lib/constants";

const logger = createLogger("Transcript");

export type TranscriptSource = "youtube" | "stt" | "none";

export interface TranscriptResult {
  transcript: string | null;
  source: TranscriptSource;
  segments?: STTSegment[];
  detectedLanguage?: {
    code: string;
    probability: number;
  };
  /** 자막 언어 코드 (YouTube 자막일 경우) */
  captionLanguage?: string;
  /** 한국어 자막 여부 (번역 불필요) */
  isKorean?: boolean;
}

/** YouTube 자막 트랙 정보 */
interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // 'asr' = 자동 생성
}

/**
 * 영어 자막 코드 확인
 */
function isEnglishCode(code: string): boolean {
  return ["en", "en-US", "en-GB", "en-AU", "en-CA"].includes(code);
}

/**
 * 한국어 자막 코드 확인
 */
function isKoreanCode(code: string): boolean {
  return ["ko", "ko-KR"].includes(code);
}

/**
 * 자막 트랙 선택 (영어 우선)
 * 우선순위: 영어 수동 > 영어 자동 > 한국어 > 기타
 */
function selectCaptionTrack(tracks: CaptionTrack[]): { track: CaptionTrack; isKorean: boolean } | null {
  if (tracks.length === 0) return null;

  // 1. 영어 수동 자막 (kind가 없거나 'asr'이 아닌 것)
  const englishManual = tracks.find(
    (t) => isEnglishCode(t.languageCode) && t.kind !== "asr"
  );
  if (englishManual) return { track: englishManual, isKorean: false };

  // 2. 영어 자동 생성 자막
  const englishAuto = tracks.find(
    (t) => isEnglishCode(t.languageCode) && t.kind === "asr"
  );
  if (englishAuto) return { track: englishAuto, isKorean: false };

  // 3. 한국어 자막 (번역 불필요)
  const korean = tracks.find((t) => isKoreanCode(t.languageCode));
  if (korean) return { track: korean, isKorean: true };

  // 4. 첫 번째 자막 (기타 언어)
  return { track: tracks[0], isKorean: false };
}

/**
 * YouTube 자막 추출 (비공식 방식) - 타임스탬프 포함
 * 페이지 HTML에서 captionTracks를 파싱하여 자막 추출
 */
async function fetchYouTubeTranscript(videoId: string): Promise<{
  transcript: string;
  segments: STTSegment[];
  languageCode: string;
  isKorean: boolean;
} | null> {
  try {
    // YouTube 페이지에서 자막 데이터 추출 시도
    const response = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "Accept-Language": "en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7",
        },
      }
    );
    const html = await response.text();

    // captionTracks 찾기
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) {
      return null;
    }

    const captionTracks: CaptionTrack[] = JSON.parse(captionMatch[1]);
    const selection = selectCaptionTrack(captionTracks);
    if (!selection) {
      return null;
    }

    const { track: selectedTrack, isKorean } = selection;
    logger.info("YouTube 자막 트랙 선택", {
      languageCode: selectedTrack.languageCode,
      isKorean,
      kind: selectedTrack.kind || "manual",
    });

    // 자막 XML 가져오기
    const transcriptResponse = await fetch(selectedTrack.baseUrl);
    const transcriptXml = await transcriptResponse.text();

    // XML에서 텍스트와 타임스탬프 추출
    const segmentMatches = transcriptXml.matchAll(
      /<text start="([^"]*)" dur="([^"]*)"[^>]*>(.*?)<\/text>/g
    );

    const segments: STTSegment[] = [];
    const texts: string[] = [];

    for (const match of segmentMatches) {
      const start = parseFloat(match[1]);
      const dur = parseFloat(match[2]);
      const text = match[3]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        .replace(/<[^>]*>/g, "")
        .trim();

      if (text) {
        segments.push({
          start,
          end: start + dur,
          text,
        });
        texts.push(text);
      }
    }

    return {
      transcript: texts.join(" ").slice(0, TRANSCRIPT.MAX_LENGTH),
      segments,
      languageCode: selectedTrack.languageCode,
      isKorean,
    };
  } catch (error) {
    logger.error("YouTube 자막 추출 실패", error);
    return null;
  }
}

/**
 * STT를 통한 자막 추출 (segments 포함)
 */
async function fetchSTTTranscript(
  videoId: string,
  language: string = "auto"
): Promise<{
  text: string;
  segments: STTSegment[];
  detectedLanguage: { code: string; probability: number };
} | null> {
  try {
    logger.info("STT 오디오 다운로드 시작");
    const audioBuffer = await downloadAudio(videoId);
    logger.info("STT 오디오 다운로드 완료", {
      sizeInMB: (audioBuffer.length / 1024 / 1024).toFixed(2),
    });

    logger.info("STT WhisperX API 호출 시작");
    const result = await transcribeAudio(audioBuffer, language);
    logger.info("STT WhisperX API 완료", {
      textLength: result.text.length,
      segmentsCount: result.segments.length,
      language: result.language,
      languageProbability: (result.languageProbability * 100).toFixed(1),
    });

    return {
      text: result.text.slice(0, TRANSCRIPT.MAX_LENGTH),
      segments: result.segments,
      detectedLanguage: {
        code: result.language,
        probability: result.languageProbability,
      },
    };
  } catch (error) {
    logger.error("STT 실패", error);
    return null;
  }
}

/**
 * 자막 추출 (YouTube 우선, STT fallback)
 * - YouTube 자막: 영어 우선 선택, 타임스탬프 포함
 * - STT: WhisperX 사용, 세그먼트 포함
 */
export async function fetchTranscript(
  videoId: string,
  duration: number,
  language: string = "auto"
): Promise<TranscriptResult> {
  logger.info("자막 추출 시작", { videoId, duration });

  // 1. YouTube 자막 시도 (영어 우선)
  logger.info("YouTube 자막 추출 시도 (영어 우선)");
  const youtubeResult = await fetchYouTubeTranscript(videoId);

  if (youtubeResult && youtubeResult.segments.length > 0) {
    logger.info("YouTube 자막 성공", {
      length: youtubeResult.transcript.length,
      segmentsCount: youtubeResult.segments.length,
      languageCode: youtubeResult.languageCode,
      isKorean: youtubeResult.isKorean,
    });

    return {
      transcript: youtubeResult.transcript,
      source: "youtube",
      segments: youtubeResult.segments,
      captionLanguage: youtubeResult.languageCode,
      isKorean: youtubeResult.isKorean,
      detectedLanguage: {
        code: youtubeResult.languageCode,
        probability: 1.0, // YouTube 자막은 확실한 언어
      },
    };
  }
  logger.info("YouTube 자막 없음 또는 파싱 실패");

  // 2. STT fallback (영상 길이 제한 확인)
  const withinLimit = isWithinSTTLimit(duration);
  logger.info("STT 제한 확인", { duration, withinLimit });

  if (withinLimit) {
    logger.info("STT 변환 시작");
    const sttResult = await fetchSTTTranscript(videoId, language);
    if (sttResult) {
      logger.info("STT 성공", {
        textLength: sttResult.text.length,
        segmentsCount: sttResult.segments.length,
        detectedLanguage: sttResult.detectedLanguage.code,
      });

      // STT 결과에서 한국어 감지 시
      const isKorean = isKoreanCode(sttResult.detectedLanguage.code);

      return {
        transcript: sttResult.text,
        source: "stt",
        segments: sttResult.segments,
        detectedLanguage: sttResult.detectedLanguage,
        isKorean,
      };
    }
    logger.info("STT 실패");
  }

  // 3. 모두 실패
  logger.info("모든 방법 실패 - 메타데이터만 사용");
  return { transcript: null, source: "none" };
}
