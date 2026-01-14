"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { UrlInput } from "@/components/url-input";
import { AnalysisResult } from "@/components/analysis-result";
import { LoadingState } from "@/components/loading-state";
import { VideoAnalysis, AnalyzeResponse } from "@/types/analysis";
import { getRandomSampleVideo } from "@/mocks/sample-videos";
import { formatDuration, formatViewCount } from "@/lib/youtube";
import { RotateCcw, AlertCircle, Play, Clock, Eye, Shuffle } from "lucide-react";

async function analyzeVideo(url: string): Promise<VideoAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data: AnalyzeResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || "Analysis failed");
  }

  return data.data;
}

// Sample video preview component
function SampleVideoPreview({
  video,
  onShuffle,
  onTryThis,
}: {
  video: VideoAnalysis;
  onShuffle: () => void;
  onTryThis: () => void;
}) {
  return (
    <div className="border border-border h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <p className="swiss-caption">예시 분석</p>
        <button
          onClick={onShuffle}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Shuffle className="w-4 h-4" />
          다른 영상
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Thumbnail - larger and centered */}
        <div className="relative w-full aspect-video bg-muted">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-1" />
            </div>
          </div>
          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 font-mono">
            {formatDuration(video.duration)}
          </div>
        </div>

        {/* Info */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex-1">
            <h3
              className="font-semibold text-lg leading-tight mb-2 line-clamp-2 cursor-default"
              title={video.title}
            >
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {video.channelName}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViewCount(video.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(video.duration)}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button onClick={onTryThis} className="swiss-button w-full justify-center">
              이 영상 분석하기
            </button>
          </div>
        </div>
      </div>

      {/* Summary preview */}
      <div className="p-6 border-t border-border bg-muted/30">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {video.summary.split("\n")[0]}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {video.keywords.slice(0, 4).map((keyword, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 border border-border"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [result, setResult] = useState<VideoAnalysis | null>(null);
  const [sampleVideo, setSampleVideo] = useState<VideoAnalysis | null>(null);

  // Load random sample video on mount
  useEffect(() => {
    setSampleVideo(getRandomSampleVideo());
  }, []);

  const mutation = useMutation({
    mutationFn: analyzeVideo,
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleAnalyze = (url: string) => {
    setResult(null);
    mutation.mutate(url);
  };

  const handleReset = () => {
    setResult(null);
    mutation.reset();
  };

  const handleShuffle = () => {
    setSampleVideo(getRandomSampleVideo());
  };

  const handleTrySample = () => {
    if (sampleVideo) {
      // Use the sample video directly as the result
      setResult(sampleVideo);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)]">
      <div className="max-w-[1200px] mx-auto px-8">
        {/* Hero Section */}
        {!result && !mutation.isPending && (
          <section className="py-16 md:py-24">
            <div className="grid grid-cols-12 gap-8 md:gap-12">
              {/* Left: Title & URL Input */}
              <div className="col-span-12 md:col-span-6">
                <p className="swiss-caption mb-4">유튜브 영상 분석기</p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
                  볼 만한
                  <br />
                  영상인가요?
                </h1>
                <p className="text-lg text-muted-foreground mb-10">
                  유튜브 URL을 붙여넣고 요약, 핵심 장면, 시청 추천을 즉시 받아보세요.
                </p>

                {/* URL Input - Prominent */}
                <div className="border-2 border-foreground p-1">
                  <UrlInput
                    onAnalyze={handleAnalyze}
                    isLoading={mutation.isPending}
                  />
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  youtube.com, youtu.be 링크 지원
                </p>
              </div>

              {/* Right: Sample Video Preview */}
              <div className="col-span-12 md:col-span-6">
                {sampleVideo && (
                  <SampleVideoPreview
                    video={sampleVideo}
                    onShuffle={handleShuffle}
                    onTryThis={handleTrySample}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Error State */}
        {mutation.isError && (
          <section className="py-16">
            <div className="border border-destructive bg-destructive/5 p-8">
              <div className="flex items-start gap-6">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">분석 실패</h3>
                  <p className="text-muted-foreground mb-6">
                    {mutation.error instanceof Error
                      ? mutation.error.message
                      : "알 수 없는 오류가 발생했습니다"}
                  </p>
                  <button
                    onClick={handleReset}
                    className="swiss-button-ghost swiss-button"
                  >
                    <RotateCcw className="w-4 h-4" />
                    다시 시도
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {mutation.isPending && (
          <section className="py-16">
            <LoadingState />
          </section>
        )}

        {/* Result */}
        {result && (
          <section className="py-16">
            <div className="flex justify-between items-center mb-12 pb-6 border-b border-border">
              <p className="swiss-caption">분석 결과</p>
              <button
                onClick={handleReset}
                className="swiss-button-ghost swiss-button"
              >
                <RotateCcw className="w-4 h-4" />
                새 분석
              </button>
            </div>
            <AnalysisResult analysis={result} />
          </section>
        )}

        {/* Footer */}
        <footer className="py-12 border-t border-border">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">QuickPreview v1.0</p>
            <p className="text-sm text-muted-foreground">WIGTN</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
