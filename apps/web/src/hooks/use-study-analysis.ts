"use client";

import { useState, useCallback, useRef } from "react";
import { StudyAnalysisResult } from "@/types/study";
import { analyzeArticle, StudyAnalysisError } from "@/lib/services/study";

interface StudyAnalysisState {
  isLoading: boolean;
  result: StudyAnalysisResult | null;
  error: { code: string; message: string } | null;
}

export function useStudyAnalysis() {
  const [state, setState] = useState<StudyAnalysisState>({
    isLoading: false,
    result: null,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(
    async (text: string, targetLanguage: string, title?: string) => {
      // Cancel previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState({ isLoading: true, result: null, error: null });

      try {
        const result = await analyzeArticle(text, targetLanguage, title);
        if (!abortControllerRef.current.signal.aborted) {
          setState({ isLoading: false, result, error: null });
        }
        return result;
      } catch (err) {
        if (abortControllerRef.current.signal.aborted) return null;
        const error =
          err instanceof StudyAnalysisError
            ? { code: err.code, message: err.message }
            : { code: "UNKNOWN_ERROR", message: String(err) };
        setState({ isLoading: false, result: null, error });
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({ isLoading: false, result: null, error: null });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}
