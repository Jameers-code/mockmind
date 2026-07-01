import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, jobRole, interviewType, difficulty } = body;

    if (!resumeText || !jobRole || !interviewType || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields: resumeText, jobRole, interviewType, difficulty" },
        { status: 400 }
      );
    }

    const customApiKey = req.headers.get("x-api-key");
    const customProvider = req.headers.get("x-ai-provider");

    const questions = await generateQuestions(
      resumeText,
      jobRole,
      interviewType,
      difficulty,
      customProvider,
      customApiKey
    );
    return NextResponse.json(questions);
  } catch (error: unknown) {
    console.error("API generate-questions error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate questions";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
