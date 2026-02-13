"""Word/phrase lookup endpoint"""

import structlog
from fastapi import APIRouter, Request

from app.models.article_schemas import WordLookupRequest, WordLookupResponse
from app.services.article.word_lookup import lookup_word
from app.core.rate_limiter import limiter
from app.core.exceptions import AIServiceError

logger = structlog.get_logger()
router = APIRouter()


@router.post("/article/word-lookup", response_model=WordLookupResponse)
@limiter.limit("60/minute")
async def word_lookup_endpoint(request: Request, body: WordLookupRequest) -> WordLookupResponse:
    """Look up a word or phrase with context from the sentence."""
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "word_lookup_start",
        request_id=request_id,
        word=body.word,
    )

    try:
        result = await lookup_word(
            word=body.word,
            sentence=body.sentence,
        )

        return WordLookupResponse(success=True, data=result)

    except AIServiceError:
        raise
    except Exception as e:
        logger.error("word_lookup_error", request_id=request_id, error=str(e))
        raise AIServiceError(
            code="LLM_ERROR",
            message=f"Word lookup failed: {str(e)}",
            status_code=500,
        )
