"use client";

import { useRouter } from "next/navigation";
import { StudyArticle } from "@/types/study";
import { BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600",
  intermediate: "bg-yellow-500/10 text-yellow-600",
  advanced: "bg-red-500/10 text-red-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  news: "News",
  culture: "Culture",
  technology: "Tech",
  lifestyle: "Life",
  economy: "Economy",
};

interface ArticleListProps {
  articles: StudyArticle[];
}

export function ArticleList({ articles }: ArticleListProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {articles.map((article) => (
        <button
          key={article.id}
          onClick={() => router.push(`/read/${article.id}`)}
          className="bento-card p-4 md:p-5 text-left hover:border-accent/50 transition-all group"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  LEVEL_STYLES[article.level] || "bg-muted text-muted-foreground",
                )}
              >
                {article.level}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {CATEGORY_LABELS[article.category] || article.category}
              </span>
            </div>
            <GraduationCap className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent transition-colors" />
          </div>

          <h3 className="font-semibold text-sm md:text-base text-foreground mb-1.5 group-hover:text-accent transition-colors">
            {article.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {article.content.slice(0, 100)}...
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/50">{article.source}</span>
            <div className="flex items-center gap-1 text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              <BookOpen className="w-3 h-3" />
              Read
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
