"""Translation service - Batch translation with OpenAI"""

import json
import logging
import asyncio
from typing import TypedDict
from openai import OpenAI, APIConnectionError, RateLimitError, APIStatusError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode

logger = logging.getLogger(__name__)


class SegmentInput(TypedDict):
    start: float
    end: float
    text: str


class TranslatedSegmentOutput(TypedDict):
    start: float
    end: float
    original_text: str
    translated_text: str


# Batch configuration
BATCH_SIZE = 10
CONTEXT_SIZE = 2
CONCURRENT_BATCHES = 3


def get_openai_client() -> OpenAI:
    """Get OpenAI client"""
    settings = get_settings()
    if not settings.openai_api_key:
        raise AIServiceError(
            code=ErrorCode.CONFIGURATION_ERROR,
            message="OpenAI API key not configured",
            status_code=500,
        )
    return OpenAI(api_key=settings.openai_api_key)


def chunk_array(array: list, size: int) -> list[list]:
    """Split array into chunks of specified size"""
    return [array[i:i + size] for i in range(0, len(array), size)]


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((APIConnectionError, RateLimitError)),
    before_sleep=before_sleep_log(logger, logging.WARNING),
)
async def translate_batch(
    client: OpenAI,
    segments: list[SegmentInput],
    source_language: str,
    target_language: str,
    context_text: str = "",
) -> list[str]:
    """Translate a single batch of segments"""
    settings = get_settings()

    segments_json = [{"id": idx, "text": seg["text"]} for idx, seg in enumerate(segments)]

    prompt = (
        f'이전 문맥: "{context_text}"\n\n번역할 자막:\n{json.dumps(segments_json, ensure_ascii=False, indent=2)}'
        if context_text
        else f'번역할 자막:\n{json.dumps(segments_json, ensure_ascii=False, indent=2)}'
    )

    # Determine translation direction
    if source_language == "ko" and target_language == "en":
        system_prompt = """당신은 한국어→영어 자막 번역 전문가입니다.

규칙:
1. 자연스러운 영어로 번역하세요
2. 기술 용어는 적절한 영어 용어로 번역하세요
3. 구어체 표현은 자연스럽게 의역하세요
4. 번역 결과만 JSON 배열로 반환하세요

출력 형식:
{
  "translations": [
    {"id": 0, "text": "Translated text"},
    {"id": 1, "text": "Translated text"}
  ]
}

JSON만 반환하세요. 다른 설명은 포함하지 마세요."""
    else:
        system_prompt = """당신은 영어→한국어 자막 번역 전문가입니다.

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

JSON만 반환하세요. 다른 설명은 포함하지 마세요."""

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content or "{}")
        translations = result.get("translations", [])

        # Sort by id and extract text
        return [
            next(
                (t["text"] for t in translations if t["id"] == idx),
                segments[idx]["text"]  # Fallback to original
            )
            for idx in range(len(segments))
        ]

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse translation response: {e}")
        return [seg["text"] for seg in segments]
    except (APIConnectionError, RateLimitError):
        raise
    except APIStatusError as e:
        logger.error(f"OpenAI API error: {e}")
        return [seg["text"] for seg in segments]


async def translate_segments(
    segments: list[SegmentInput],
    source_language: str = "en",
    target_language: str = "ko",
) -> list[TranslatedSegmentOutput]:
    """
    Translate all segments with batch processing.

    - Processes segments in batches for efficiency
    - Maintains context across batches
    - Concurrent batch processing
    """
    if not segments:
        return []

    logger.info(f"Starting translation: {len(segments)} segments")

    client = get_openai_client()
    batches = chunk_array(segments, BATCH_SIZE)
    translated_segments: list[TranslatedSegmentOutput] = []

    logger.info(f"Created {len(batches)} batches (size: {BATCH_SIZE})")

    previous_context = ""

    for i in range(0, len(batches), CONCURRENT_BATCHES):
        concurrent_batches = batches[i:i + CONCURRENT_BATCHES]

        # Process batches concurrently
        async def process_batch(batch: list[SegmentInput], batch_idx: int) -> list[TranslatedSegmentOutput]:
            absolute_batch_idx = i + batch_idx
            context = "" if absolute_batch_idx == 0 else previous_context

            logger.debug(f"Translating batch {absolute_batch_idx + 1}/{len(batches)}")

            translations = await translate_batch(
                client, batch, source_language, target_language, context
            )

            return [
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "original_text": seg["text"],
                    "translated_text": translations[idx],
                }
                for idx, seg in enumerate(batch)
            ]

        tasks = [
            process_batch(batch, batch_idx)
            for batch_idx, batch in enumerate(concurrent_batches)
        ]
        results = await asyncio.gather(*tasks)

        for batch_result in results:
            translated_segments.extend(batch_result)

        # Update context for next batch
        last_batch = concurrent_batches[-1]
        if last_batch:
            context_segments = last_batch[-CONTEXT_SIZE:]
            previous_context = " ".join(seg["text"] for seg in context_segments)

        logger.info(f"Batch progress: {min(i + CONCURRENT_BATCHES, len(batches))}/{len(batches)}")

    logger.info(f"Translation completed: {len(translated_segments)} segments")

    return translated_segments
