"""Korean article analysis service — translation + expression extraction"""

import json
import time
import structlog
from openai import OpenAI

from app.config import get_settings
from app.core.exceptions import AIServiceError, ErrorCode

logger = structlog.get_logger()

SYSTEM_PROMPTS = {
    "en": (
        "You are a Korean language learning assistant for English-speaking learners.\n"
        "IMPORTANT: All translations, meanings, and explanations MUST be in English."
    ),
    "ja": (
        "あなたは日本語話者向けの韓国語学習アシスタントです。\n"
        "重要: すべての翻訳、意味、説明は必ず日本語で書いてください。"
    ),
    "zh": (
        "你是面向中文使用者的韩语学习助手。\n"
        "重要: 所有翻译、含义和解释必须用中文书写。"
    ),
}

TASK_PROMPT = """Analyze the given Korean article and return a JSON response with:

1. "sentences": Array of objects, each with:
   - "id": sentence index (0-based)
   - "original": the Korean sentence
   - "translated": natural translation in the target language

2. "expressions": Array of 5-15 Korean idioms, collocations, and key vocabulary:
   - "expression": the Korean expression
   - "meaning": translation in the target language
   - "category": one of "idiom", "collocation", "slang", "formal_expression", "grammar_pattern"
   - "sentenceId": sentence index where it appears (0-based)
   - "context": the form used in the article

Focus on expressions that are:
- Commonly used in Korean but hard for foreigners to understand
- Different from literal word-by-word translation
- Important for understanding Korean news/media

Split the text into sentences carefully. Handle abbreviations and quotation marks properly.
Return ONLY valid JSON with "sentences" and "expressions" keys."""


def _get_system_prompt(target_language: str) -> str:
    base = SYSTEM_PROMPTS.get(
        target_language,
        f"You are a Korean language learning assistant.\n"
        f"IMPORTANT: All translations, meanings, and explanations MUST be written in the language with code '{target_language}'. "
        f"The user does not understand Korean.",
    )
    return base


def get_openai_client() -> OpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        raise AIServiceError(
            code=ErrorCode.CONFIGURATION_ERROR,
            message="OpenAI API key not configured",
            status_code=500,
        )
    return OpenAI(api_key=settings.openai_api_key, timeout=30.0)


async def analyze_article(
    text: str,
    target_language: str = "en",
    title: str | None = None,
) -> dict:
    """Analyze a Korean article: split sentences, translate, extract expressions."""
    start_time = time.time()
    settings = get_settings()
    client = get_openai_client()

    system_prompt = _get_system_prompt(target_language)
    user_content = f"Target language: {target_language}\n\n"
    if title:
        user_content += f"Title: {title}\n\n"
    user_content += f"Article:\n{text}"

    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_prompt + "\n\n" + TASK_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        sentences = result.get("sentences", [])
        expressions = result.get("expressions", [])

        processing_time = (time.time() - start_time) * 1000

        return {
            "sentences": sentences,
            "expressions": expressions,
            "meta": {
                "sentenceCount": len(sentences),
                "expressionCount": len(expressions),
                "targetLanguage": target_language,
                "processingTime": round(processing_time, 1),
            },
        }

    except json.JSONDecodeError as e:
        logger.error("openai_response_parse_failed", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="Failed to parse analysis result",
            status_code=500,
        )
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("article_analysis_failed", error=str(e))
        raise AIServiceError(
            code=ErrorCode.LLM_ERROR,
            message="Article analysis failed",
            status_code=500,
        )
