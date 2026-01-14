/**
 * AI 기반 비디오 분석 서비스
 */

import OpenAI from "openai";
import { STTSegment } from "@/lib/stt";

interface VideoMetadata {
  title: string;
  channelName: string;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  watchScore: number;
  watchScoreReason: string;
  keywords: string[];
  highlights: Array<{
    timestamp: number;
    title: string;
    description: string;
  }>;
}

/**
 * OpenAI 클라이언트 생성
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  return new OpenAI({ apiKey });
}

/**
 * 초를 MM:SS 형식으로 변환
 */
function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * AI 분석 수행
 */
export async function analyzeWithAI(
  metadata: VideoMetadata,
  transcript: string | null,
  segments?: STTSegment[]
): Promise<AnalysisResult> {
  // segments가 있으면 타임스탬프 포함된 형식으로 변환
  const formattedTranscript =
    segments && segments.length > 0
      ? segments.map((seg) => `[${formatSeconds(seg.start)}] ${seg.text}`).join("\n")
      : transcript;

  const content = formattedTranscript
    ? `영상 제목: ${metadata.title}
채널: ${metadata.channelName}
설명: ${metadata.description?.slice(0, 500)}

자막 내용 (타임스탬프 포함):
${formattedTranscript}`
    : `영상 제목: ${metadata.title}
채널: ${metadata.channelName}
설명: ${metadata.description}

(자막이 없어 메타데이터만으로 분석합니다)`;

  const hasTimestamps = segments && segments.length > 0;

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `당신은 YouTube 영상 분석 전문가입니다. 영상의 내용을 분석하여 다음 정보를 JSON 형식으로 제공해주세요:

1. summary: 영상 내용을 3문장으로 요약 (각 문장은 50자 이내)
2. watchScore: 시청 가치 점수 (1-10, 정수)
3. watchScoreReason: 점수 근거 (50자 이내)
4. keywords: 핵심 키워드 배열 (5-10개)
5. highlights: 핵심 구간 배열 (최대 5개, 각각 timestamp(초), title(20자이내), description(50자이내))
${hasTimestamps ? "\n주의: 자막에 [MM:SS] 형식의 타임스탬프가 있습니다. highlights의 timestamp는 반드시 자막의 실제 타임스탬프를 참고하여 정확한 초 단위로 입력하세요." : ""}

JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.`,
      },
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");

  return {
    summary: result.summary || "요약을 생성할 수 없습니다.",
    watchScore: Math.min(10, Math.max(1, result.watchScore || 5)),
    watchScoreReason: result.watchScoreReason || "분석 정보가 부족합니다.",
    keywords: result.keywords || [],
    highlights: result.highlights || [],
  };
}
