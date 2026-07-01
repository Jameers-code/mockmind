import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateReport } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { answersList, jobRole, difficulty, interviewType } = body;

    if (!answersList || !jobRole || !difficulty || !interviewType) {
      return NextResponse.json(
        { error: "Missing required fields: answersList, jobRole, difficulty, interviewType" },
        { status: 400 }
      );
    }

    const customApiKey = req.headers.get("x-api-key");
    const customProvider = req.headers.get("x-ai-provider");

    // Call Groq API to generate report summary
    const report = await generateReport(answersList, jobRole, difficulty, customProvider, customApiKey);

    // Save to database if user is logged in
    const session = await getServerSession(authOptions);
    let savedSessionId = null;

    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (user) {
          const newDbSession = await prisma.session.create({
            data: {
              userId: user.id,
              role: jobRole,
              type: interviewType,
              difficulty: difficulty,
              overallScore: report.overallScore,
              communication: report.communication,
              technicalDepth: report.technicalDepth,
              clarity: report.clarity,
              confidence: report.confidence,
              questions: JSON.stringify(answersList),
              strengths: JSON.stringify(report.strengths),
              improvements: JSON.stringify(report.improvements),
            },
          });
          savedSessionId = newDbSession.id;
        }
      } catch (dbError) {
        console.error("Failed to save interview session to database:", dbError);
        // Do not crash the API, still return the report
      }
    }

    return NextResponse.json({
      ...report,
      id: savedSessionId,
    });
  } catch (error: unknown) {
    console.error("API generate-report error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate report";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
