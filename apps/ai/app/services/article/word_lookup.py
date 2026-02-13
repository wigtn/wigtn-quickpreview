"""Word/phrase lookup service"""

import json
import structlog
from openai import OpenAI

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode

logger = structlog.get_logger()

SYSTEM_PROMPT = """당신은 영어 단어/구문 해석 전문가입니다.
한국인 영어 학습자를 위해 선택한 단어나 구문의 뜻을 문맥과 함께 설명해주세요.

다음 JSON 형식으로 응답해주세요:

1. "word": 조회된 단어/구문
2. "pronunciation": 발음기호 (IPA 형식, 예: /ˈɪntrəst/)
3. "meanings": 사전적 뜻 배열
   - "definition": 한국어 뜻
   - "partOfSpeech": 품사 (noun/verb/adjective/adverb/phrase 등)
4. "contextMeaning": 이 문장에서의 구체적인 의미 (한국어)
5. "examples": 예문 2-3개 (영어)

JSON만 반환하세요."""


def _get_openai_client() -> OpenAI:
    settings = get_settings()
    return OpenAI(api_key=settings.openai_api_key, timeout=15.0)


async def lookup_word(
    word: str,
    sentence: str,
) -> dict:
    """Look up a word or phrase with context from the sentence."""
    settings = get_settings()
    client = _get_openai_client()

    user_content = f"조회할 단어/구문: {word}\n포함된 문장: {sentence}"

    logger.info("word_lookup_start", word=word, sentence_length=len(sentence))

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            timeout=15,
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        logger.info("word_lookup_complete", word=word)

        return {
            "word": result.get("word", word),
            "pronunciation": result.get("pronunciation"),
            "meanings": result.get("meanings", []),
            "contextMeaning": result.get("contextMeaning", ""),
            "examples": result.get("examples", []),
        }

    except json.JSONDecodeError as e:
        logger.error("word_lookup_json_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="단어 조회 결과를 파싱할 수 없습니다",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("word_lookup_error", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message=f"단어 조회에 실패했습니다: {str(e)}",
            status_code=500,
        )
