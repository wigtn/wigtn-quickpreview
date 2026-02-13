"use client";

import type { ArticleExpression } from "@/features/article/types/article";

interface ExpressionSummaryProps {
  expressions: ArticleExpression[];
}

const CATEGORY_LABELS: Record<string, string> = {
  idiom: "Idiom",
  phrasal_verb: "Phrasal Verb",
  collocation: "Collocation",
  technical_term: "Technical Term",
  grammar_pattern: "Grammar",
  formal_expression: "Formal",
  slang: "Slang",
};

export function ExpressionSummary({ expressions }: ExpressionSummaryProps) {
  const grouped = expressions.reduce<Record<string, ArticleExpression[]>>(
    (acc, expr) => {
      const cat = expr.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(expr);
      return acc;
    },
    {},
  );

  const categories = Object.entries(grouped);

  if (categories.length === 0) return null;

  return (
    <div className="px-4 py-6 border-t border-border">
      <h3 className="text-base font-semibold mb-1">Expression Summary</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Expressions found in this article
      </p>

      <div className="space-y-5">
        {categories.map(([category, exprs]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-foreground mb-2">
              {CATEGORY_LABELS[category] || category} ({exprs.length})
            </h4>
            <ul className="space-y-1.5">
              {exprs.map((expr, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground"
                >
                  <span className="text-muted-foreground">· </span>
                  <span className="text-foreground font-medium">
                    {expr.expression}
                  </span>
                  <span> — {expr.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
