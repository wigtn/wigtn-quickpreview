"use client";

import { useState } from "react";
import type { ArticleExpression } from "@/features/article/types/article";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

interface ExpressionBarProps {
  expressions: ArticleExpression[];
  onExpressionClick?: (sentenceId: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  idiom: "숙어",
  phrasal_verb: "구동사",
  collocation: "연어",
  technical_term: "전문용어",
};

export function ExpressionBar({
  expressions,
  onExpressionClick,
}: ExpressionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (expressions.length === 0) return null;

  const displayExpressions = isExpanded
    ? expressions
    : expressions.slice(0, 6);

  return (
    <div className="border-b border-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">
              주요 표현
            </span>
            <span className="text-xs text-muted-foreground">
              {expressions.length}개
            </span>
          </div>
          {expressions.length > 6 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  접기 <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  더 보기 <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {displayExpressions.map((expr, index) => (
            <button
              key={index}
              onClick={() => onExpressionClick?.(expr.sentenceId)}
              className="group text-left px-3 py-2 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-all"
            >
              <div className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                {expr.expression}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {expr.meaning}
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                {CATEGORY_LABELS[expr.category] || expr.category}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
