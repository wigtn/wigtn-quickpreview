"use client";

import { useParams, useRouter } from "next/navigation";
import { sampleArticles } from "@/data/articles";
import { ArticleReader } from "@/components/study/article-reader";

export default function ReadArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;

  const article = sampleArticles.find((a) => a.id === articleId);

  if (!article) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-2">Article not found</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-accent hover:underline"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <ArticleReader article={article} onBack={() => router.push("/")} />
    </div>
  );
}
