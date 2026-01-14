import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractVideoId } from "@/lib/youtube";
import { fetchVideoMetadata } from "@/lib/services/youtube-metadata";
import { fetchTranscript } from "@/lib/services/transcript";
import { analyzeWithAI } from "@/lib/services/ai-analysis";
import { translateSegments, needsTranslation } from "@/lib/services/translation";
import { createLogger } from "@/lib/logger";
import { TranscriptSegment } from "@/types/analysis";

const logger = createLogger("AnalyzeAPI");

// Request body 스키마 검증
const AnalyzeRequestSchema = z.object({
  url: z.string().min(1, "URL을 입력해주세요"),
  language: z.string().optional().default("auto"),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Zod 스키마 검증
    const parseResult = AnalyzeRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: firstIssue.message,
          },
        },
        { status: 400 }
      );
    }

    const { url, language } = parseResult.data;

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_URL",
            message: "올바른 YouTube URL을 입력해주세요",
          },
        },
        { status: 400 }
      );
    }

    // 메타데이터 조회
    let metadata;
    try {
      metadata = await fetchVideoMetadata(videoId);
    } catch (error) {
      if (error instanceof Error && error.message === "VIDEO_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VIDEO_NOT_FOUND",
              message: "영상을 찾을 수 없습니다",
            },
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // 자막 추출 (YouTube 우선, STT fallback)
    const transcriptResult = await fetchTranscript(videoId, metadata.duration, language);
    const {
      transcript,
      source: transcriptSource,
      segments,
      detectedLanguage,
      isKorean,
    } = transcriptResult;

    logger.info("자막 추출 완료", {
      source: transcriptSource,
      hasSegments: !!segments,
      segmentCount: segments?.length || 0,
      isKorean,
    });

    // 번역 처리 (한국어가 아닌 경우에만)
    let translatedSegments: TranscriptSegment[] | undefined;

    if (segments && segments.length > 0) {
      const languageCode = detectedLanguage?.code || "en";

      if (!isKorean && needsTranslation(languageCode)) {
        logger.info("번역 시작", { languageCode, segmentCount: segments.length });

        try {
          const translated = await translateSegments(segments);

          // TranscriptSegment 형식으로 변환
          translatedSegments = translated.map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.translatedText, // 하위 호환성
            originalText: seg.originalText,
            translatedText: seg.translatedText,
          }));

          logger.info("번역 완료", { translatedCount: translatedSegments.length });
        } catch (error) {
          logger.error("번역 실패, 원본 사용", error);
          // 번역 실패 시 원본 세그먼트 사용
          translatedSegments = segments.map((seg) => ({
            ...seg,
            originalText: seg.text,
            translatedText: seg.text,
          }));
        }
      } else {
        // 한국어인 경우 번역 불필요
        logger.info("한국어 자막 - 번역 불필요");
        translatedSegments = segments.map((seg) => ({
          ...seg,
          originalText: seg.text,
          translatedText: seg.text,
        }));
      }
    }

    // AI 분석 (번역된 텍스트로 분석)
    const analysisTranscript = translatedSegments
      ? translatedSegments.map((seg) => seg.translatedText).join(" ")
      : transcript;

    const analysis = await analyzeWithAI(
      metadata,
      analysisTranscript,
      translatedSegments || segments
    );

    const result = {
      id: crypto.randomUUID(),
      url,
      ...metadata,
      ...analysis,
      language,
      transcriptSource,
      detectedLanguage: detectedLanguage || undefined,
      transcript: transcript || undefined,
      transcriptSegments: translatedSegments || segments || undefined,
      isKorean: isKorean || false,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Analysis error", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        },
      },
      { status: 500 }
    );
  }
}
