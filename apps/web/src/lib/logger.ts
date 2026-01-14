/**
 * 로깅 유틸리티
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, data?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = `[${this.context}]`;
    const levelStr = `[${level.toUpperCase()}]`;
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `${timestamp} ${levelStr} ${contextStr} ${message}${dataStr}`;
  }

  info(message: string, data?: LogContext): void {
    console.log(this.formatMessage("info", message, data));
  }

  warn(message: string, data?: LogContext): void {
    console.warn(this.formatMessage("warn", message, data));
  }

  error(message: string, error?: Error | unknown, data?: LogContext): void {
    const errorData = error instanceof Error
      ? { error: error.message, stack: error.stack, ...data }
      : { error, ...data };
    console.error(this.formatMessage("error", message, errorData));
  }

  debug(message: string, data?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message, data));
    }
  }
}

/**
 * Logger 인스턴스 생성
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}
