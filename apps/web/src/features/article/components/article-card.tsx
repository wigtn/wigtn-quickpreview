"use client";

import Link from "next/link";
import type { CuratedArticle } from "@/features/article/data/curated-articles";
import {
  CATEGORY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
} from "@/features/article/data/curated-articles";

interface ArticleCardProps {
  article: CuratedArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/read?article=${article.id}`}
      className="group block rounded-lg border border-border p-4 hover:border-accent/50 hover:shadow-sm transition-all bg-[var(--card,var(--background))]"
    >
      {/* Difficulty + Category */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium ${DIFFICULTY_COLORS[article.difficulty]}`}>
          {DIFFICULTY_LABELS[article.difficulty]}
        </span>
        <span className="text-xs text-muted-foreground">
          · {CATEGORY_LABELS[article.category]}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-accent transition-colors">
        {article.title}
      </h3>

      {/* Preview */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
        {article.preview}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {article.readingTimeMinutes} min read
        </span>
        <span className="text-sm text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Read →
        </span>
      </div>
    </Link>
  );
}
