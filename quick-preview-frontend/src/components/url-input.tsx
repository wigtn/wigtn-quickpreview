"use client";

import { useState } from "react";
import { isValidYouTubeUrl } from "@/lib/youtube";
import { Search, Loader2 } from "lucide-react";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("URL을 입력해주세요");
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setError("올바른 유튜브 URL을 입력해주세요");
      return;
    }

    setError("");
    onAnalyze(url);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-0">
        <div className="flex-1">
          <input
            type="text"
            placeholder="유튜브 URL을 붙여넣으세요..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
            className="w-full h-14 px-4 bg-transparent border border-border border-r-0 text-base focus:outline-none focus:border-foreground disabled:opacity-50 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="swiss-button h-14 px-8 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              분석 중
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              분석
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-3">{error}</p>
      )}
    </form>
  );
}
