"""Translation endpoint - Batch translation with OpenAI"""

import time
import logging
from fastapi import APIRouter, Request

from app.models.schemas import (
    TranslateRequest,
    TranslateResponse,
    TranslationData,
    TranslationMeta,
    TranslatedSegment,
)
from app.services.translation import translate_segments
from app.core.rate_limiter import limiter
from app.core.exceptions import AIServiceError, ErrorCode

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/translate", response_model=TranslateResponse)
@limiter.limit("30/minute")
async def translate(
    request: Request,
    body: TranslateRequest,
):
    """
    Translate segments from source language to target language.

    - Batch processing with context preservation
    - Concurrent batch execution for performance
    - Falls back to original text on error
    """
    start_time = time.time()

    logger.info(
        "Translation request",
        extra={
            "segments_count": len(body.segments),
            "source_language": body.source_language,
            "target_language": body.target_language,
        }
    )

    try:
        # Convert request segments to translation format
        segments = [
            {"start": seg.start, "end": seg.end, "text": seg.text}
            for seg in body.segments
        ]

        # Perform translation
        translated = await translate_segments(
            segments=segments,
            source_language=body.source_language,
            target_language=body.target_language,
        )

        processing_time = time.time() - start_time

        # Build response
        translated_segments = [
            TranslatedSegment(
                start=seg["start"],
                end=seg["end"],
                originalText=seg["original_text"],
                translatedText=seg["translated_text"],
            )
            for seg in translated
        ]

        logger.info(
            "Translation completed",
            extra={
                "translated_count": len(translated_segments),
                "processing_time": round(processing_time, 2),
            }
        )

        return TranslateResponse(
            success=True,
            data=TranslationData(segments=translated_segments),
            meta=TranslationMeta(
                translatedCount=len(translated_segments),
                processingTime=round(processing_time, 3),
            ),
        )

    except Exception as e:
        logger.error(f"Translation failed: {str(e)}")
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message=f"번역 처리 중 오류가 발생했습니다: {str(e)}",
            status_code=500,
        )
