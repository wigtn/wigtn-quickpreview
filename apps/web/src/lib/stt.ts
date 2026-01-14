import { getEnvConfig } from "./config/env";
import { createLogger } from "./logger";

const logger = createLogger("STT");

export interface STTSegment {
  start: number;
  end: number;
  text: string;
}

export interface STTResult {
  text: string;
  language: string;
  languageProbability: number;
  segments: STTSegment[];
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  language: string = "auto"
): Promise<STTResult> {
  const config = getEnvConfig();

  if (!config.STT_API_URL) {
    throw new Error("STT_API_URL is not configured");
  }

  const formData = new FormData();

  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: "audio/webm" });
  formData.append("audio", blob, "audio.webm");
  formData.append("language", language);

  const response = await fetch(`${config.STT_API_URL}/whisperX/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`STT API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  logger.debug("STT API 응답", {
    text_length: result.text?.length || 0,
    language: result.language,
    language_probability: result.language_probability,
    segments_count: result.segments?.length || 0,
    segments_sample: result.segments?.slice(0, 3) || [],
  });

  return {
    text: result.text || "",
    language: result.language || language,
    languageProbability: result.language_probability ?? 1.0,
    segments: result.segments || [],
  };
}

export function isWithinSTTLimit(durationSeconds: number): boolean {
  const config = getEnvConfig();
  return durationSeconds <= config.STT_MAX_DURATION_MINUTES * 60;
}
