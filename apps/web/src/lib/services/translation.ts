/**
 * 번역 서비스 - 배치 처리를 통한 효율적인 번역
 */

import OpenAI from "openai";
import { createLogger } from "@/lib/logger";

const logger = createLogger("Translation");

/** 번역할 세그먼트 */
export interface TranslationSegment {
  start: number;
  end: number;
  text: string;
}

/** 번역된 세그먼트 */
export interface TranslatedSegment {
  start: number;
  end: number;
  originalText: string;
  translatedText: string;
}

/** 배치 번역 설정 */
const BATCH_CONFIG = {
  /** 배치당 세그먼트 수 */
  BATCH_SIZE: 10,
  /** 문맥 유지용 이전 세그먼트 수 */
  CONTEXT_SIZE: 2,
  /** 동시 처리 배치 수 */
  CONCURRENT_BATCHES: 3,
};

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
 * 배열을 지정된 크기로 청크 분할
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 단일 배치 번역
 */
async function translateBatch(
  openai: OpenAI,
  segments: TranslationSegment[],
  contextText: string = ""
): Promise<string[]> {
  const segmentsJson = segments.map((seg, idx) => ({
    id: idx,
    text: seg.text,
  }));

  const prompt = contextText
    ? `이전 문맥: "${contextText}"\n\n번역할 자막:\n${JSON.stringify(segmentsJson, null, 2)}`
    : `번역할 자막:\n${JSON.stringify(segmentsJson, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `당신은 영어→한국어 자막 번역 전문가입니다.

규칙:
1. 자연스러운 한국어로 번역하세요
2. 기술 용어는 필요시 원어를 괄호 안에 병기하세요 (예: API(API))
3. 구어체 표현은 자연스럽게 의역하세요
4. 번역 결과만 JSON 배열로 반환하세요

출력 형식:
{
  "translations": [
    {"id": 0, "text": "번역된 텍스트"},
    {"id": 1, "text": "번역된 텍스트"}
  ]
}

JSON만 반환하세요. 다른 설명은 포함하지 마세요.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    const translations = result.translations || [];

    // id 순서대로 정렬하여 텍스트만 추출
    return segments.map((_, idx) => {
      const found = translations.find((t: { id: number; text: string }) => t.id === idx);
      return found?.text || segments[idx].text; // 실패 시 원본 반환
    });
  } catch (error) {
    logger.error("번역 결과 파싱 실패", error);
    return segments.map((seg) => seg.text); // 실패 시 원본 반환
  }
}

/**
 * 전체 세그먼트 배치 번역
 */
export async function translateSegments(
  segments: TranslationSegment[]
): Promise<TranslatedSegment[]> {
  if (segments.length === 0) {
    return [];
  }

  logger.info("번역 시작", { totalSegments: segments.length });

  const openai = getOpenAIClient();
  const batches = chunkArray(segments, BATCH_CONFIG.BATCH_SIZE);
  const translatedSegments: TranslatedSegment[] = [];

  logger.info("배치 생성", {
    batchCount: batches.length,
    batchSize: BATCH_CONFIG.BATCH_SIZE,
  });

  // 배치별 순차 처리 (문맥 유지를 위해)
  let previousContext = "";

  for (let i = 0; i < batches.length; i += BATCH_CONFIG.CONCURRENT_BATCHES) {
    const concurrentBatches = batches.slice(i, i + BATCH_CONFIG.CONCURRENT_BATCHES);

    // 동시에 처리할 배치들
    const batchPromises = concurrentBatches.map(async (batch, batchIdx) => {
      const absoluteBatchIdx = i + batchIdx;

      // 첫 배치가 아니면 이전 문맥 사용
      const context = absoluteBatchIdx === 0 ? "" : previousContext;

      logger.debug(`배치 ${absoluteBatchIdx + 1}/${batches.length} 번역 중`);

      const translations = await translateBatch(openai, batch, context);

      return batch.map((seg, idx) => ({
        start: seg.start,
        end: seg.end,
        originalText: seg.text,
        translatedText: translations[idx],
      }));
    });

    const results = await Promise.all(batchPromises);

    for (const batchResult of results) {
      translatedSegments.push(...batchResult);
    }

    // 다음 배치를 위한 문맥 업데이트 (마지막 2개 세그먼트)
    const lastBatch = concurrentBatches[concurrentBatches.length - 1];
    if (lastBatch && lastBatch.length > 0) {
      const contextSegments = lastBatch.slice(-BATCH_CONFIG.CONTEXT_SIZE);
      previousContext = contextSegments.map((seg) => seg.text).join(" ");
    }

    logger.info(`배치 진행`, {
      completed: Math.min(i + BATCH_CONFIG.CONCURRENT_BATCHES, batches.length),
      total: batches.length,
    });
  }

  logger.info("번역 완료", { translatedCount: translatedSegments.length });

  return translatedSegments;
}

/**
 * 번역이 필요한지 확인
 */
export function needsTranslation(languageCode: string): boolean {
  const koreanCodes = ["ko", "ko-KR"];
  return !koreanCodes.includes(languageCode);
}
