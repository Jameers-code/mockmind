import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, answer, resumeText, jobRole, language, difficulty } = body;

    if (!question || answer === undefined || !resumeText || !jobRole) {
      return NextResponse.json(
        { error: "Missing required fields: question, answer, resumeText, jobRole" },
        { status: 400 }
      );
    }

    const customApiKey = req.headers.get("x-api-key");
    const customProvider = req.headers.get("x-ai-provider");

    const evaluation = await evaluateAnswer(
      question,
      answer,
      resumeText,
      jobRole,
      customProvider,
      customApiKey,
      language,
      difficulty
    );
    return NextResponse.json(evaluation);
  } catch (error: unknown) {
    console.error("API evaluate-answer error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to evaluate answer";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
