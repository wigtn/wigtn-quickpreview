import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StudyAnalyzeAPI");

const SUPPORTED_LANGUAGES = new Set(["en", "ja", "zh", "es", "vi", "th", "id"]);

const StudyAnalyzeSchema = z.object({
  text: z.string().min(1, "Text is required").max(15000, "Text too long (15000 char limit)"),
  targetLanguage: z.string().refine((v) => SUPPORTED_LANGUAGES.has(v), {
    message: "Unsupported language",
  }),
  title: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    const parseResult = StudyAnalyzeSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_REQUEST", message: firstIssue.message },
        },
        { status: 400 },
      );
    }

    const { text, targetLanguage, title } = parseResult.data;

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (!aiServiceUrl) {
      logger.error("AI_SERVICE_URL not configured");
      return NextResponse.json(
        {
          success: false,
          error: { code: "CONFIGURATION_ERROR", message: "Service not configured" },
        },
        { status: 500 },
      );
    }

    logger.info("Study analyze request", {
      textLength: text.length,
      targetLanguage,
      hasTitle: !!title,
    });

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.INTERNAL_API_KEY) {
      headers["X-Internal-API-Key"] = process.env.INTERNAL_API_KEY;
    }

    const response = await fetch(`${aiServiceUrl}/api/v1/study/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        text,
        targetLanguage,
        title: title || undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      logger.error("AI service error", { status: response.status, error: result.error });
      return NextResponse.json(
        {
          success: false,
          error: result.error || {
            code: "AI_SERVICE_ERROR",
            message: "Analysis failed",
          },
        },
        { status: response.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Study analyze error", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 },
    );
  }
}
