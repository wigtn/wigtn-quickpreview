"""Pydantic schemas for Korean Study API"""

from pydantic import BaseModel, Field, field_validator


SUPPORTED_LANGUAGES = {"en", "ja", "zh", "es", "vi", "th", "id"}


class StudyAnalyzeRequest(BaseModel):
    """Request for /study/analyze endpoint"""
    text: str = Field(..., min_length=1)
    title: str | None = None
    target_language: str = Field(default="en", alias="targetLanguage")

    class Config:
        populate_by_name = True

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if len(v) > 15000:
            raise ValueError("Text too long (15000 char limit)")
        return v.strip()

    @field_validator("target_language")
    @classmethod
    def validate_target_language(cls, v: str) -> str:
        if v not in SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language: {v}. Supported: {', '.join(sorted(SUPPORTED_LANGUAGES))}")
        return v


class StudySentence(BaseModel):
    """A sentence pair (original + translated)"""
    id: int
    original: str
    translated: str


class StudyExpression(BaseModel):
    """An extracted Korean expression"""
    expression: str
    meaning: str
    category: str  # idiom | collocation | slang | formal_expression | grammar_pattern
    sentence_id: int = Field(alias="sentenceId")
    context: str

    class Config:
        populate_by_name = True


class StudyAnalysisMeta(BaseModel):
    """Metadata for study analysis"""
    sentence_count: int = Field(alias="sentenceCount")
    expression_count: int = Field(alias="expressionCount")
    target_language: str = Field(alias="targetLanguage")
    processing_time: float = Field(alias="processingTime")

    class Config:
        populate_by_name = True


class StudyAnalysisResult(BaseModel):
    """Full study analysis result"""
    sentences: list[StudySentence]
    expressions: list[StudyExpression]
    meta: StudyAnalysisMeta


class StudyAnalyzeResponse(BaseModel):
    """Response for /study/analyze endpoint"""
    success: bool = True
    data: StudyAnalysisResult
