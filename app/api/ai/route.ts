export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { callOpenAI } from "@/app/services/openai.service";
import { callClaude } from "@/app/services/claude.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query?.trim();
    const tab = body?.tab?.trim() || "Overview";
    const provider = body?.provider === "claude" ? "claude" : "openai";

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // the prompt and checking the answer both happen inside these
    const result = provider === "claude" ? await callClaude(query, tab) : await callOpenAI(query, tab);
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
