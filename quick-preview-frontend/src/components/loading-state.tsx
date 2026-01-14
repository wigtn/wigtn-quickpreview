"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "URL 검증 중", duration: 500 },
  { label: "메타데이터 가져오는 중", duration: 1500 },
  { label: "자막 추출 중", duration: 2000 },
  { label: "오디오 처리 중", duration: 8000 },
  { label: "AI 분석 중", duration: 4000 },
  { label: "결과 생성 중", duration: 1000 },
];

export function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    let elapsed = 0;
    const totalDuration = STEPS.reduce((sum, step) => sum + step.duration, 0);

    const interval = setInterval(() => {
      elapsed += 100;

      let cumulativeDuration = 0;
      for (let i = 0; i < STEPS.length; i++) {
        cumulativeDuration += STEPS[i].duration;
        if (elapsed < cumulativeDuration) {
          stepIndex = i;
          break;
        }
      }
      setCurrentStep(stepIndex);

      const newProgress = Math.min((elapsed / totalDuration) * 100, 95);
      setProgress(newProgress);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12">
      {/* Progress Header */}
      <div className="grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 md:col-span-3">
          <p className="swiss-caption">처리 중</p>
        </div>
        <div className="col-span-12 md:col-span-9">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">
                {STEPS[currentStep]?.label}
              </span>
              <span className="text-sm text-muted-foreground font-mono">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1 bg-muted w-full">
              <div
                className="h-full bg-foreground transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-3">
          <p className="swiss-caption">진행 단계</p>
        </div>
        <div className="col-span-12 md:col-span-9">
          <div className="flex gap-4">
            {STEPS.map((step, index) => (
              <div
                key={index}
                className={`flex-1 h-1 transition-colors ${
                  index <= currentStep ? "bg-foreground" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-3">
            <span className="text-xs text-muted-foreground">시작</span>
            <span className="text-xs text-muted-foreground">완료</span>
          </div>
        </div>
      </div>

      {/* Skeleton Preview */}
      <div className="border border-border p-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Thumbnail Skeleton */}
          <div className="col-span-12 md:col-span-5">
            <div className="aspect-video bg-muted animate-pulse" />
          </div>

          {/* Content Skeleton */}
          <div className="col-span-12 md:col-span-7 space-y-4">
            <div className="h-7 bg-muted animate-pulse w-3/4" />
            <div className="h-5 bg-muted animate-pulse w-1/3" />
            <div className="flex gap-4 mt-4">
              <div className="h-4 bg-muted animate-pulse w-20" />
              <div className="h-4 bg-muted animate-pulse w-20" />
              <div className="h-4 bg-muted animate-pulse w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Skeleton */}
      <div className="border border-border p-8">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 md:col-span-3">
            <div className="h-4 bg-muted animate-pulse w-24 mb-3" />
            <div className="h-16 bg-muted animate-pulse w-20" />
          </div>
          <div className="col-span-12 md:col-span-9">
            <div className="h-2 bg-muted animate-pulse w-full mb-4" />
            <div className="flex justify-between">
              <div className="h-4 bg-muted animate-pulse w-32" />
              <div className="h-4 bg-muted animate-pulse w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="swiss-index">
        <div>
          <div className="h-4 bg-muted animate-pulse w-20" />
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-muted animate-pulse w-full" />
          <div className="h-4 bg-muted animate-pulse w-full" />
          <div className="h-4 bg-muted animate-pulse w-3/4" />
        </div>
      </div>

      {/* Keywords Skeleton */}
      <div className="swiss-index">
        <div>
          <div className="h-4 bg-muted animate-pulse w-20" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse w-20" />
          ))}
        </div>
      </div>
    </div>
  );
}
