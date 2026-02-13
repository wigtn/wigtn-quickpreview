"use client";

import { useState, useCallback } from "react";
import { StudyArticle, SUPPORTED_LANGUAGES } from "@/types/study";
import { useStudyAnalysis } from "@/hooks/use-study-analysis";
import { StudyModePanel } from "./study-mode-panel";
import { BookOpen, GraduationCap, Loader2, ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "read" | "study";

interface ArticleReaderProps {
  article: StudyArticle;
  onBack: () => void;
}

export function ArticleReader({ article, onBack }: ArticleReaderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("read");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const { isLoading, result, error, analyze, reset } = useStudyAnalysis();

  const handleStudyMode = useCallback(async () => {
    if (result && viewMode === "study") {
      setViewMode("read");
      return;
    }

    if (!result) {
      await analyze(article.content, targetLanguage, article.title);
    }
    setViewMode("study");
  }, [result, viewMode, analyze, article, targetLanguage]);

  const handleLanguageChange = useCallback(
    async (lang: string) => {
      setTargetLanguage(lang);
      setShowLanguageSelect(false);
      if (viewMode === "study") {
        reset();
        await analyze(article.content, lang, article.title);
      }
    },
    [viewMode, analyze, reset, article],
  );

  const selectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage);

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-(--background-elevated)">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageSelect(!showLanguageSelect)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              {selectedLang?.label || targetLanguage}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showLanguageSelect && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLanguageSelect(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-(--background-elevated) border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
                        lang.code === targetLanguage && "text-accent font-medium",
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mode Toggle */}
          <button
            onClick={handleStudyMode}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all font-medium",
              viewMode === "study"
                ? "bg-accent text-white"
                : "bg-muted hover:bg-muted/80 text-foreground",
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : viewMode === "study" ? (
              <>
                <BookOpen className="w-3.5 h-3.5" />
                Read Mode
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5" />
                Study Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "read" ? (
          /* Reading Mode */
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    {article.level}
                  </span>
                  <span className="text-xs text-muted-foreground">{article.source}</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground leading-tight">
                  {article.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-2">{article.publishedAt}</p>
              </div>

              <div className="prose prose-sm max-w-none">
                {article.content.split("\n\n").map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-foreground/90 leading-relaxed mb-4 text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : result ? (
          /* Study Mode */
          <StudyModePanel
            sentences={result.sentences}
            expressions={result.expressions}
            targetLanguage={targetLanguage}
          />
        ) : error ? (
          /* Error */
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <p className="text-sm text-red-500 mb-2">{error.message}</p>
              <button
                onClick={() => analyze(article.content, targetLanguage, article.title)}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
