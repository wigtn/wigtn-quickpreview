"use client";

import { useEffect, useRef, useState } from "react";
import { TranscriptSegment } from "@/types/analysis";
import { Languages, ChevronDown, Scroll } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScriptPanelProps {
  segments: TranscriptSegment[];
  activeIndex: number;
  onSegmentClick: (seconds: number) => void;
  autoScrollEnabled: boolean;
  onToggleAutoScroll: () => void;
  isKorean?: boolean;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ScriptPanel({
  segments,
  activeIndex,
  onSegmentClick,
  autoScrollEnabled,
  onToggleAutoScroll,
  isKorean = false,
}: ScriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // 자동 스크롤
  useEffect(() => {
    if (autoScrollEnabled && activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;

      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      // 활성 요소가 컨테이너 중앙에 오도록 스크롤
      const scrollTop =
        active.offsetTop - container.offsetTop - containerRect.height / 2 + activeRect.height / 2;

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "smooth",
      });
    }
  }, [activeIndex, autoScrollEnabled]);

  // 원본/번역 토글 가능 여부 (번역된 세그먼트가 있는 경우)
  const hasTranslation = segments.some(
    (seg) => seg.originalText && seg.translatedText && seg.originalText !== seg.translatedText
  );

  return (
    <div className="flex flex-col h-full border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {isKorean ? "자막" : "번역 스크립트"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({segments.length}개 구간)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 원본/번역 토글 */}
          {hasTranslation && !isKorean && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={cn(
                "text-xs px-2 py-1 rounded transition-colors",
                showOriginal
                  ? "bg-foreground text-background"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {showOriginal ? "원본" : "번역"}
            </button>
          )}

          {/* 자동 스크롤 토글 */}
          <button
            onClick={onToggleAutoScroll}
            className={cn(
              "p-1.5 rounded transition-colors",
              autoScrollEnabled
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
            title={autoScrollEnabled ? "자동 스크롤 켜짐" : "자동 스크롤 꺼짐"}
          >
            <Scroll className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Segments List */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {segments.map((segment, index) => {
          const isActive = index === activeIndex;
          const displayText = showOriginal
            ? segment.originalText || segment.text
            : segment.translatedText || segment.text;

          return (
            <button
              key={index}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSegmentClick(segment.start)}
              className={cn(
                "w-full text-left flex gap-3 px-4 py-3 transition-all border-l-2",
                isActive
                  ? "bg-accent/10 border-l-accent"
                  : "border-l-transparent hover:bg-muted/50"
              )}
            >
              {/* Timestamp */}
              <span
                className={cn(
                  "text-xs font-mono shrink-0 pt-0.5",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                {formatTimestamp(segment.start)}
              </span>

              {/* Text */}
              <span
                className={cn(
                  "text-sm leading-relaxed",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {displayText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer - 현재 위치 표시 */}
      {activeIndex >= 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {activeIndex + 1} / {segments.length}
            </span>
            <span className="flex items-center gap-1">
              <ChevronDown className="w-3 h-3" />
              스크롤하여 탐색
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
