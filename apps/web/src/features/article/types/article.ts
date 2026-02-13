/** Article feature types */

export interface ArticleMeta {
  title: string;
  source: string;
  author: string | null;
  publishedDate: string | null;
  url: string | null;
}

export interface ArticleSentence {
  id: number;
  original: string;
  translated: string;
}

export interface ArticleExpression {
  expression: string;
  meaning: string;
  category: "idiom" | "phrasal_verb" | "collocation" | "technical_term" | "grammar_pattern" | "formal_expression" | "slang";
  sentenceId: number;
  context: string;
}

export interface ArticleAnalysisMeta {
  sentenceCount: number;
  expressionCount: number;
  processingTime: number;
}

export interface ArticleAnalysisResult {
  article: ArticleMeta;
  sentences: ArticleSentence[];
  expressions: ArticleExpression[];
  meta: ArticleAnalysisMeta;
}

export type ArticleDisplayMode = "both" | "original" | "translated";

/** Sentence structure parsing */

export interface SentenceComponent {
  id: number;
  text: string;
  role: string;
  explanation: string;
  parentId: number | null;
}

export interface GrammarPoint {
  type: string;
  explanation: string;
  highlight: string;
}

export interface SentenceParseResult {
  components: SentenceComponent[];
  readingOrder: string;
  grammarPoints: GrammarPoint[];
}

/** Word lookup */

export interface WordMeaning {
  definition: string;
  partOfSpeech: string;
}

export interface WordLookupResult {
  word: string;
  pronunciation: string | null;
  meanings: WordMeaning[];
  contextMeaning: string;
  examples: string[];
}
