"use client";

import { StudyExpression } from "@/types/study";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  idiom: { label: "Idiom", color: "bg-purple-500/10 text-purple-600" },
  collocation: { label: "Collocation", color: "bg-blue-500/10 text-blue-600" },
  slang: { label: "Slang", color: "bg-orange-500/10 text-orange-600" },
  formal_expression: { label: "Formal", color: "bg-green-500/10 text-green-600" },
  grammar_pattern: { label: "Grammar", color: "bg-rose-500/10 text-rose-600" },
};

interface ExpressionCardProps {
  expression: StudyExpression;
  onClickSentence?: (sentenceId: number) => void;
}

export function ExpressionCard({ expression, onClickSentence }: ExpressionCardProps) {
  const cat = CATEGORY_LABELS[expression.category] || {
    label: expression.category,
    color: "bg-muted text-muted-foreground",
  };

  return (
    <div className="rounded-lg border border-border p-3 hover:bg-(--background-hover) transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-semibold text-foreground">
          {expression.expression}
        </span>
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium", cat.color)}>
          {cat.label}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-1.5">{expression.meaning}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground/60 italic">
          &ldquo;{expression.context}&rdquo;
        </span>
        {onClickSentence && (
          <button
            onClick={() => onClickSentence(expression.sentenceId)}
            className="text-xs text-accent hover:underline shrink-0 ml-2"
          >
            #{expression.sentenceId + 1}
          </button>
        )}
      </div>
    </div>
  );
}
