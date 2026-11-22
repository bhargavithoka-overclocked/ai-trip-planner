export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { callOpenAI } from "@/app/services/openai.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query?.trim();
    const tab = body?.tab?.trim() || "Overview";

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // the prompt and checking the answer both happen inside callOpenAI
    const result = await callOpenAI(query, tab);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI API error:", error);

    return NextResponse.json(
      {
        error: "AI processing failed",
        message:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
