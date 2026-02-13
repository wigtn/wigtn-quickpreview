"""API Router - combines all endpoints"""

from fastapi import APIRouter

from . import health
from .video import analyze, stt, translate
from .study import analyze as study_analyze
from .article import analyze as article_analyze
from .article import parse_sentence as article_parse
from .article import word_lookup as article_lookup

router = APIRouter()

# Health check (root level)
router.include_router(health.router, tags=["health"])

# STT endpoints (root level for backward compatibility)
router.include_router(stt.router, tags=["stt"])

# API v1 endpoints
router.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
router.include_router(translate.router, prefix="/api/v1", tags=["translate"])
router.include_router(study_analyze.router, prefix="/api/v1", tags=["study"])
router.include_router(article_analyze.router, prefix="/api/v1", tags=["article"])
router.include_router(article_parse.router, prefix="/api/v1", tags=["article"])
router.include_router(article_lookup.router, prefix="/api/v1", tags=["article"])
