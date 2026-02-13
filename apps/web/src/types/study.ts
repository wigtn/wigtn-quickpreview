/** Study feature types */

export interface StudyArticle {
  id: string;
  title: string;
  source: string;
  category: "news" | "culture" | "technology" | "lifestyle" | "economy";
  level: "beginner" | "intermediate" | "advanced";
  content: string;
  thumbnailUrl?: string;
  publishedAt: string;
}

export interface StudySentence {
  id: number;
  original: string;
  translated: string;
}

export interface StudyExpression {
  expression: string;
  meaning: string;
  category: "idiom" | "collocation" | "slang" | "formal_expression" | "grammar_pattern";
  sentenceId: number;
  context: string;
}

export interface StudyAnalysisMeta {
  sentenceCount: number;
  expressionCount: number;
  targetLanguage: string;
  processingTime: number;
}

export interface StudyAnalysisResult {
  sentences: StudySentence[];
  expressions: StudyExpression[];
  meta: StudyAnalysisMeta;
}

export interface StudyAnalyzeResponse {
  success: boolean;
  data?: StudyAnalysisResult;
  error?: {
    code: string;
    message: string;
  };
}

export type StudyDisplayMode = "both" | "original" | "translated";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ภาษาไทย" },
  { code: "id", label: "Bahasa Indonesia" },
] as const;
