/**
 * 애플리케이션 전역 상수
 */

/**
 * 자막 관련 상수
 */
export const TRANSCRIPT = {
  /** 자막 최대 길이 (토큰 제한) */
  MAX_LENGTH: 15000,
} as const;

/**
 * 오디오 처리 관련 상수
 */
export const AUDIO = {
  /** 오디오 다운로드 타임아웃 (밀리초) */
  DOWNLOAD_TIMEOUT: 300000, // 5분
} as const;

/**
 * STT 관련 상수
 */
export const STT = {
  /** STT 최대 영상 길이 기본값 (분) */
  DEFAULT_MAX_DURATION_MINUTES: 20,
} as const;

/**
 * YouTube 관련 상수
 */
export const YOUTUBE = {
  /** YouTube 비디오 ID 길이 */
  VIDEO_ID_LENGTH: 11,
  /** YouTube 비디오 ID 패턴 */
  VIDEO_ID_PATTERN: /^[a-zA-Z0-9_-]{11}$/,
} as const;
