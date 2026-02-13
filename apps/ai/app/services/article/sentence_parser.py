"""Sentence structure parsing service"""

import json
import structlog
from openai import OpenAI

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode

logger = structlog.get_logger()

SYSTEM_PROMPT = """당신은 영어 문장 구조 분석 전문가입니다.
한국인 영어 학습자가 긴 영어 문장을 이해할 수 있도록 도와주세요.

주어진 문장을 다음 JSON 형식으로 분석해주세요:

1. "components": 문장 성분별 분해
   - "id": 고유 번호 (0부터)
   - "text": 원문 텍스트 조각
   - "role": 문법적 역할 (주어/동사/목적어/보어/부사구/관계사절/분사구문/전치사구/접속사/to부정사)
   - "explanation": 한국어 뜻
   - "parentId": 상위 성분 id (최상위는 null)

2. "readingOrder": 한국어 어순으로 재배열한 읽기 순서 (/ 로 구분)

3. "grammarPoints": 주요 문법 포인트 (해당 시)
   - "type": 문법 항목명
   - "explanation": 쉬운 한국어 설명
   - "highlight": 해당 부분 원문

JSON만 반환하세요."""


def _get_openai_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(api_key=settings.openai_api_key, timeout=30.0)


async def parse_sentence(
    sentence: str,
    context: str | None = None,
) -> dict:
    """Parse an English sentence into grammatical components."""
    settings = get_settings()
    client = _get_openai_client()

    user_content = f"분석할 문장: {sentence}"
    if context:
        user_content += f"\n\n전후 문맥: {context}"

    logger.info("sentence_parse_start", sentence_length=len(sentence))

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            timeout=30,
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        logger.info(
            "sentence_parse_complete",
            components_count=len(result.get("components", [])),
            grammar_points_count=len(result.get("grammarPoints", [])),
        )

        return {
            "components": result.get("components", []),
            "readingOrder": result.get("readingOrder", ""),
            "grammarPoints": result.get("grammarPoints", []),
        }

    except json.JSONDecodeError as e:
        logger.error("sentence_parse_json_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="구조 분석 결과를 파싱할 수 없습니다",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("sentence_parse_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message=f"문장 구조 분석에 실패했습니다: {str(e)}",
            status_code=500,
        )
