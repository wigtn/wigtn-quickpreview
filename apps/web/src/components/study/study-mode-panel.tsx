"use client";

import { useRef, useEffect, useState } from "react";
import { StudySentence, StudyExpression, StudyDisplayMode } from "@/types/study";
import { ExpressionCard } from "./expression-card";
import { Languages, BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "sentences" | "expressions";

interface StudyModePanelProps {
  sentences: StudySentence[];
  expressions: StudyExpression[];
  targetLanguage: string;
}

export function StudyModePanel({
  sentences,
  expressions,
  targetLanguage,
}: StudyModePanelProps) {
  const [displayMode, setDisplayMode] = useState<StudyDisplayMode>("both");
  const [activeTab, setActiveTab] = useState<Tab>("sentences");
  const [activeSentenceId, setActiveSentenceId] = useState<number | null>(null);
  const sentenceRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const scrollToSentence = (sentenceId: number) => {
    setActiveTab("sentences");
    setActiveSentenceId(sentenceId);
    const el = sentenceRefs.current.get(sentenceId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    if (activeSentenceId !== null) {
      const timer = setTimeout(() => setActiveSentenceId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [activeSentenceId]);

  return (
    <div className="flex flex-col h-full bg-(--background-elevated)">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          <button
            onClick={() => setActiveTab("sentences")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-all",
              activeTab === "sentences"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Sentences
          </button>
          <button
            onClick={() => setActiveTab("expressions")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-all",
              activeTab === "expressions"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Expressions
            <span className="text-[10px] opacity-60">({expressions.length})</span>
          </button>
        </div>

        {activeTab === "sentences" && (
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <button
              onClick={() => setDisplayMode("both")}
              className={cn(
                "px-2 py-1 text-xs rounded transition-all",
                displayMode === "both"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Both
            </button>
            <button
              onClick={() => setDisplayMode("original")}
              className={cn(
                "px-2 py-1 text-xs rounded transition-all",
                displayMode === "original"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Languages className="w-3.5 h-3.5 inline mr-1" />
              KR
            </button>
            <button
              onClick={() => setDisplayMode("translated")}
              className={cn(
                "px-2 py-1 text-xs rounded transition-all",
                displayMode === "translated"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {targetLanguage.toUpperCase()}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "sentences" ? (
          <div className="divide-y divide-border">
            {sentences.map((sentence) => {
              const isHighlighted = activeSentenceId === sentence.id;

              return (
                <div
                  key={sentence.id}
                  ref={(el) => {
                    if (el) sentenceRefs.current.set(sentence.id, el);
                  }}
                  className={cn(
                    "px-4 py-3 transition-all border-l-2",
                    isHighlighted
                      ? "bg-accent/10 border-l-accent"
                      : "border-l-transparent",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-muted-foreground/50 pt-1 shrink-0 w-5 text-right">
                      {sentence.id + 1}
                    </span>

                    <div className="flex flex-col gap-1.5 flex-1">
                      {(displayMode === "both" || displayMode === "original") && (
                        <p className="text-sm leading-relaxed text-foreground">
                          {sentence.original}
                        </p>
                      )}
                      {(displayMode === "both" || displayMode === "translated") && (
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            displayMode === "both"
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {sentence.translated}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {expressions.map((expr, i) => (
              <ExpressionCard
                key={i}
                expression={expr}
                onClickSentence={scrollToSentence}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {activeTab === "sentences"
              ? `${sentences.length} sentences`
              : `${expressions.length} expressions`}
          </span>
          <span className="text-muted-foreground/50">
            {targetLanguage.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
