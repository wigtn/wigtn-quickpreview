"use client";

import { useEffect, useState, useRef } from "react";

const MESSAGES = [
  "AI가 분석 중입니다",
  "영상 내용을 파악하고 있어요",
  "핵심 장면을 찾고 있습니다",
  "키워드를 추출하는 중이에요",
  "자막을 분석하고 있습니다",
];

const ALMOST_DONE_MESSAGE = "거의 다 됐어요!";
const THREE_MINUTES = 180; // 3분 = 180초

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(() =>
    Math.floor(Math.random() * MESSAGES.length)
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const elapsedTimeRef = useRef(0);

  // 경과 시간 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      elapsedTimeRef.current += 1;
      setElapsedTime(elapsedTimeRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 메시지 로테이션 (3분 전에만, 페이드 애니메이션 포함)
  useEffect(() => {
    const interval = setInterval(() => {
      if (elapsedTimeRef.current >= THREE_MINUTES) return;

      setIsFading(true);
      setTimeout(() => {
        setMessageIndex((prev) => {
          let newIndex;
          do {
            newIndex = Math.floor(Math.random() * MESSAGES.length);
          } while (newIndex === prev && MESSAGES.length > 1);
          return newIndex;
        });
        setIsFading(false);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 시간 포맷 (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bento-card p-8 text-center max-w-md w-full">
      {/* Animated SVG */}
      <svg
        viewBox="0 0 200 200"
        className="w-32 h-32 mx-auto mb-6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              @keyframes pulse1 {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.15); opacity: 0.6; }
              }
              @keyframes pulse2 {
                0%, 100% { transform: scale(1); opacity: 0.4; }
                50% { transform: scale(1.1); opacity: 0.7; }
              }
              @keyframes pulse3 {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.05); opacity: 0.8; }
              }
              @keyframes rotateRing {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes dash {
                0% { stroke-dashoffset: 300; }
                50% { stroke-dashoffset: 100; }
                100% { stroke-dashoffset: 300; }
              }
              @keyframes barPulse1 {
                0%, 100% { height: 20px; opacity: 0.5; }
                50% { height: 40px; opacity: 1; }
              }
              @keyframes barPulse2 {
                0%, 100% { height: 30px; opacity: 0.6; }
                50% { height: 50px; opacity: 1; }
              }
              @keyframes barPulse3 {
                0%, 100% { height: 25px; opacity: 0.5; }
                50% { height: 45px; opacity: 1; }
              }
              @keyframes barPulse4 {
                0%, 100% { height: 35px; opacity: 0.7; }
                50% { height: 55px; opacity: 1; }
              }
              @keyframes barPulse5 {
                0%, 100% { height: 22px; opacity: 0.5; }
                50% { height: 42px; opacity: 1; }
              }
              .ring1 { animation: pulse1 2s ease-in-out infinite; transform-origin: center; }
              .ring2 { animation: pulse2 2s ease-in-out infinite 0.3s; transform-origin: center; }
              .ring3 { animation: pulse3 2s ease-in-out infinite 0.6s; transform-origin: center; }
              .rotating-ring { animation: rotateRing 3s linear infinite; transform-origin: center; }
              .dash-ring { animation: dash 2s ease-in-out infinite; }
              .bar1 { animation: barPulse1 1s ease-in-out infinite; }
              .bar2 { animation: barPulse2 1s ease-in-out infinite 0.1s; }
              .bar3 { animation: barPulse3 1s ease-in-out infinite 0.2s; }
              .bar4 { animation: barPulse4 1s ease-in-out infinite 0.3s; }
              .bar5 { animation: barPulse5 1s ease-in-out infinite 0.4s; }
            `}
          </style>
        </defs>

        {/* 배경 펄스 링 */}
        <circle
          className="ring1"
          cx="100"
          cy="100"
          r="70"
          fill="var(--accent)"
          opacity="0.3"
        />
        <circle
          className="ring2"
          cx="100"
          cy="100"
          r="55"
          fill="var(--accent)"
          opacity="0.4"
        />
        <circle
          className="ring3"
          cx="100"
          cy="100"
          r="40"
          fill="var(--accent)"
          opacity="0.5"
        />

        {/* 회전하는 대시 링 */}
        <g className="rotating-ring">
          <circle
            className="dash-ring"
            cx="100"
            cy="100"
            r="75"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray="50 30"
            strokeLinecap="round"
          />
        </g>

        {/* 중앙 오디오 파형 바 */}
        <g transform="translate(100, 100)">
          <rect
            className="bar1"
            x="-30"
            y="-20"
            width="6"
            height="20"
            rx="3"
            fill="var(--foreground)"
            style={{ transformOrigin: "center bottom" }}
          />
          <rect
            className="bar2"
            x="-18"
            y="-30"
            width="6"
            height="30"
            rx="3"
            fill="var(--foreground)"
            style={{ transformOrigin: "center bottom" }}
          />
          <rect
            className="bar3"
            x="-6"
            y="-25"
            width="6"
            height="25"
            rx="3"
            fill="var(--foreground)"
            style={{ transformOrigin: "center bottom" }}
          />
          <rect
            className="bar4"
            x="6"
            y="-35"
            width="6"
            height="35"
            rx="3"
            fill="var(--foreground)"
            style={{ transformOrigin: "center bottom" }}
          />
          <rect
            className="bar5"
            x="18"
            y="-22"
            width="6"
            height="22"
            rx="3"
            fill="var(--foreground)"
            style={{ transformOrigin: "center bottom" }}
          />
        </g>
      </svg>

      {/* Rotating Message with fade animation */}
      <div className="h-8 mb-3 flex items-center justify-center">
        <p
          className={`text-lg font-medium text-foreground transition-opacity duration-300 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          {elapsedTime >= THREE_MINUTES
            ? ALMOST_DONE_MESSAGE
            : MESSAGES[messageIndex]}
          {/* Animated dots */}
          {elapsedTime < THREE_MINUTES && <AnimatedDots />}
        </p>
      </div>

      {/* 경과 시간 타이머 */}
      <p className="text-sm text-muted-foreground">
        경과 시간:{" "}
        <span className="font-mono text-accent">{formatTime(elapsedTime)}</span>
      </p>
    </div>
  );
}

// 점 애니메이션 컴포넌트
function AnimatedDots() {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block w-6 text-left">
      {".".repeat(dotCount)}
    </span>
  );
}
