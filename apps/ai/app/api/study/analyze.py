"""Study article analysis endpoint"""

import structlog
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.models.study_schemas import StudyAnalyzeRequest, StudyAnalyzeResponse
from app.services.study.article_analyzer import analyze_article
from app.core.rate_limiter import limiter
from app.core.exceptions import AIServiceError

logger = structlog.get_logger()
router = APIRouter()


def get_study_limit() -> str:
    return "20/minute"


@router.post("/study/analyze", response_model=StudyAnalyzeResponse)
@limiter.limit(get_study_limit)
async def study_analyze(request: Request, body: StudyAnalyzeRequest) -> StudyAnalyzeResponse | JSONResponse:
    """
    Analyze a Korean article: split sentences, translate, extract expressions.
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "study_analyze_start",
        request_id=request_id,
        text_length=len(body.text),
        target_language=body.target_language,
        has_title=bool(body.title),
    )

    try:
        result = await analyze_article(
            text=body.text,
            target_language=body.target_language,
            title=body.title,
        )

        logger.info(
            "study_analyze_complete",
            request_id=request_id,
            sentence_count=result["meta"]["sentenceCount"],
            expression_count=result["meta"]["expressionCount"],
            processing_time=result["meta"]["processingTime"],
        )

        return StudyAnalyzeResponse(success=True, data=result)

    except AIServiceError:
        raise
    except Exception as e:
        logger.error("study_analyze_error", request_id=request_id, error=str(e))
        raise AIServiceError(
            code="LLM_ERROR",
            message=f"Article analysis failed: {str(e)}",
            status_code=500,
        )
