"""Pydantic schemas for Article Analysis API (English → Korean)"""

from pydantic import BaseModel, Field, field_validator


class ArticleAnalyzeRequest(BaseModel):
    """Request for /article/analyze endpoint"""
    text: str = Field(..., min_length=1)
    title: str | None = None
    source: str | None = None

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if len(v) > 15000:
            raise ValueError("Text too long (15000 char limit)")
        return v.strip()


class ArticleSentence(BaseModel):
    """A sentence pair (English original + Korean translation)"""
    id: int
    original: str
    translated: str


class ArticleExpression(BaseModel):
    """An extracted English expression"""
    expression: str
    meaning: str
    category: str  # idiom | phrasal_verb | collocation | technical_term
    sentence_id: int = Field(alias="sentenceId")
    context: str

    class Config:
        populate_by_name = True


class ArticleAnalysisMeta(BaseModel):
    """Metadata for article analysis"""
    sentence_count: int = Field(alias="sentenceCount")
    expression_count: int = Field(alias="expressionCount")
    processing_time: float = Field(alias="processingTime")

    class Config:
        populate_by_name = True


class ArticleAnalysisResult(BaseModel):
    """Full article analysis result"""
    sentences: list[ArticleSentence]
    expressions: list[ArticleExpression]
    meta: ArticleAnalysisMeta


class ArticleAnalyzeResponse(BaseModel):
    """Response for /article/analyze endpoint"""
    success: bool = True
    data: ArticleAnalysisResult


class SentenceParseRequest(BaseModel):
    """Request for /article/parse-sentence endpoint"""
    sentence: str = Field(..., min_length=1)
    context: str | None = None

    @field_validator("sentence")
    @classmethod
    def validate_sentence(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("Sentence too long (2000 char limit)")
        return v.strip()


class SentenceComponent(BaseModel):
    """A component of sentence structure"""
    id: int
    text: str
    role: str
    explanation: str
    parent_id: int | None = Field(default=None, alias="parentId")

    class Config:
        populate_by_name = True


class GrammarPoint(BaseModel):
    """A grammar point in the sentence"""
    type: str
    explanation: str
    highlight: str


class SentenceParseResult(BaseModel):
    """Result of sentence structure parsing"""
    components: list[SentenceComponent]
    reading_order: str = Field(alias="readingOrder")
    grammar_points: list[GrammarPoint] = Field(alias="grammarPoints")

    class Config:
        populate_by_name = True


class SentenceParseResponse(BaseModel):
    """Response for /article/parse-sentence endpoint"""
    success: bool = True
    data: SentenceParseResult


class WordLookupRequest(BaseModel):
    """Request for /article/word-lookup endpoint"""
    word: str = Field(..., min_length=1)
    sentence: str = Field(..., min_length=1)

    @field_validator("word")
    @classmethod
    def validate_word(cls, v: str) -> str:
        if len(v) > 200:
            raise ValueError("Word too long (200 char limit)")
        return v.strip()


class WordMeaning(BaseModel):
    """A word meaning"""
    definition: str
    part_of_speech: str = Field(alias="partOfSpeech")

    class Config:
        populate_by_name = True


class WordLookupResult(BaseModel):
    """Result of word lookup"""
    word: str
    pronunciation: str | None = None
    meanings: list[WordMeaning]
    context_meaning: str = Field(alias="contextMeaning")
    examples: list[str]

    class Config:
        populate_by_name = True


class WordLookupResponse(BaseModel):
    """Response for /article/word-lookup endpoint"""
    success: bool = True
    data: WordLookupResult
