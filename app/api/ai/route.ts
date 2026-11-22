export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { callOpenAI } from "@/app/services/openai.service";
import { callClaude } from "@/app/services/claude.service";
import { callGemini } from "@/app/services/gemini.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query?.trim();
    const tab = body?.tab?.trim() || "Overview";
    const provider = ["claude", "gemini"].includes(body?.provider) ? body.provider : "openai";

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // the prompt and checking the answer both happen inside these
    const ask = { openai: callOpenAI, claude: callClaude, gemini: callGemini }[provider as "openai" | "claude" | "gemini"];
    const result = await ask(query, tab);
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
