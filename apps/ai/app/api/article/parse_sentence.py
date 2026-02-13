"""Sentence structure parsing endpoint"""

import structlog
from fastapi import APIRouter, Request

from app.models.article_schemas import SentenceParseRequest, SentenceParseResponse
from app.services.article.sentence_parser import parse_sentence
from app.core.rate_limiter import limiter
from app.core.exceptions import AIServiceError

logger = structlog.get_logger()
router = APIRouter()


@router.post("/article/parse-sentence", response_model=SentenceParseResponse)
@limiter.limit("30/minute")
async def parse_sentence_endpoint(request: Request, body: SentenceParseRequest) -> SentenceParseResponse:
    """Parse an English sentence into grammatical components."""
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "sentence_parse_start",
        request_id=request_id,
        sentence_length=len(body.sentence),
    )

    try:
        result = await parse_sentence(
            sentence=body.sentence,
            context=body.context,
        )

        return SentenceParseResponse(success=True, data=result)

    except AIServiceError:
        raise
    except Exception as e:
        logger.error("sentence_parse_error", request_id=request_id, error=str(e))
        raise AIServiceError(
            code="LLM_ERROR",
            message=f"Sentence parsing failed: {str(e)}",
            status_code=500,
        )
