"""Article analysis endpoint — English article translation + expression extraction"""

import structlog
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.models.article_schemas import ArticleAnalyzeRequest, ArticleAnalyzeResponse
from app.services.article.article_analyzer import analyze_article
from app.core.rate_limiter import limiter
from app.core.exceptions import AIServiceError

logger = structlog.get_logger()
router = APIRouter()


def get_article_limit() -> str:
    return "20/minute"


@router.post("/article/analyze", response_model=ArticleAnalyzeResponse)
@limiter.limit(get_article_limit)
async def article_analyze(request: Request, body: ArticleAnalyzeRequest) -> ArticleAnalyzeResponse | JSONResponse:
    """
    Analyze an English article: split sentences, translate to Korean, extract expressions.
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "article_analyze_start",
        request_id=request_id,
        text_length=len(body.text),
        has_title=bool(body.title),
        has_source=bool(body.source),
    )

    try:
        result = await analyze_article(
            text=body.text,
            title=body.title,
            source=body.source,
        )

        logger.info(
            "article_analyze_complete",
            request_id=request_id,
            sentence_count=result["meta"]["sentenceCount"],
            expression_count=result["meta"]["expressionCount"],
            processing_time=result["meta"]["processingTime"],
        )

        return ArticleAnalyzeResponse(success=True, data=result)

    except AIServiceError:
        raise
    except Exception as e:
        logger.error("article_analyze_error", request_id=request_id, error=str(e))
        raise AIServiceError(
            code="LLM_ERROR",
            message=f"Article analysis failed: {str(e)}",
            status_code=500,
        )
