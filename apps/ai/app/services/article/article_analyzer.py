"""English article analysis service — sentence translation + expression extraction"""

import json
import time
import structlog
from openai import OpenAI

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode

logger = structlog.get_logger()

SYSTEM_PROMPT = """당신은 영어 뉴스 기사 학습 도우미입니다. 한국인 영어 학습자가 영어 기사를 이해할 수 있도록 도와주세요.

주어진 영어 기사를 다음 JSON 형식으로 분석해주세요:

1. "sentences": 각 문장의 원문과 자연스러운 한국어 번역
   - "id": 문장 인덱스 (0부터)
   - "original": 영어 원문 문장
   - "translated": 자연스러운 한국어 번역

2. "expressions": 기사에 포함된 숙어, 관용표현, 핵심 어휘 (5-15개)
   - "expression": 원문 표현
   - "meaning": 한국어 뜻
   - "category": "idiom" | "phrasal_verb" | "collocation" | "technical_term" 중 하나
   - "sentenceId": 해당 표현이 사용된 문장 번호 (0-indexed)
   - "context": 원문에서 사용된 형태

주의사항:
- 문장 분리 시 약어(U.S., Dr., etc.)와 인용문 내 마침표를 구분하세요
- 번역은 직역이 아닌 자연스러운 한국어로 작성하세요
- 표현은 한국인이 실제로 헷갈리거나 몰랐을 만한 것을 우선 추출하세요
- 반드시 유효한 JSON만 반환하세요"""

TASK_PROMPT = """아래 영어 기사를 분석해주세요. JSON으로만 응답하세요."""


def _get_openai_client() -> OpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        raise AIServiceError(
            code=ErrorCode.CONFIGURATION_ERROR,
            message="OpenAI API key not configured",
            status_code=500,
        )
    return OpenAI(api_key=settings.openai_api_key, timeout=60.0)


async def analyze_article(
    text: str,
    title: str | None = None,
    source: str | None = None,
) -> dict:
    """Analyze an English article: split sentences, translate to Korean, extract expressions."""
    start_time = time.time()
    settings = get_settings()
    client = _get_openai_client()

    user_content = ""
    if title:
        user_content += f"기사 제목: {title}\n"
    if source:
        user_content += f"출처: {source}\n"
    user_content += f"\n기사 본문:\n{text}"

    logger.info(
        "article_analyze_start",
        text_length=len(text),
        has_title=bool(title),
        has_source=bool(source),
    )

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": TASK_PROMPT + "\n\n" + user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            timeout=60,
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        sentences = result.get("sentences", [])
        expressions = result.get("expressions", [])

        processing_time = (time.time() - start_time) * 1000

        logger.info(
            "article_analyze_complete",
            sentence_count=len(sentences),
            expression_count=len(expressions),
            processing_time=round(processing_time, 1),
        )

        return {
            "sentences": sentences,
            "expressions": expressions,
            "meta": {
                "sentenceCount": len(sentences),
                "expressionCount": len(expressions),
                "processingTime": round(processing_time, 1),
            },
        }

    except json.JSONDecodeError as e:
        logger.error("article_analyze_json_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="AI 응답을 파싱할 수 없습니다",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("article_analyze_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message=f"기사 분석에 실패했습니다: {str(e)}",
            status_code=500,
        )
