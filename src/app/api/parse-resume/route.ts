import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in form data" },
        { status: 400 }
      );
    }

    const fileType = file.type || "";
    const fileName = file.name.toLowerCase();

    let extractedText = "";

    if (fileName.endsWith(".txt") || fileType === "text/plain") {
      extractedText = await file.text();
    } else if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse PDF using standard pdf-parse
      const parsedData = await pdf(buffer);
      extractedText = parsedData.text || "";
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload a PDF or TXT file." },
        { status: 400 }
      );
    }

    // Basic cleaning to remove redundant double newlines or spacing
    const cleanedText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!cleanedText) {
      return NextResponse.json(
        { error: "Extracted text is empty. The PDF may be scanned or empty." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: cleanedText });
  } catch (error: unknown) {
    console.error("API parse-resume error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to parse resume document";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
