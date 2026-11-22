import { ApiError, GoogleGenAI } from "@google/genai";
import { buildPrompt } from "./prompt.service";
import { parseModelJson, validateAIResponse } from "./validation.service";
import { AIResult } from "@/app/types/travel.types";

// the free tier's quick model; set GEMINI_MODEL to try another one
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const NOT_SET_UP = "Gemini isn't set up. Add GEMINI_API_KEY to .env.local and restart the app.";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(NOT_SET_UP);
  }
  return new GoogleGenAI({ apiKey, httpOptions: { timeout: 60000 } });
}

/**
 * Same job as callOpenAI and callClaude, using Google's free Gemini tier.
 */
export async function callGemini(query: string, tab: string): Promise<AIResult> {
  const client = getClient();

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: buildPrompt(query, tab),
      config: {
        systemInstruction: "You are a helpful travel planning assistant.",
        // ask for plain JSON so there's no markdown to strip
        responseMimeType: "application/json",
      },
    });
    return validateAIResponse(parseModelJson(response.text ?? ""));
  } catch (error) {
    if (error instanceof ApiError) {
      // Google answers a wrong key with 400 and the free tier's daily limit with 429
      if (error.status === 400 && /(api|auth) key/i.test(error.message)) {
        throw new Error("Google didn't accept your Gemini key. Gemini keys start with AIza, copy it again from aistudio.google.com/apikey.");
      }
      if (error.status === 429) {
        throw new Error("Gemini's free tier limit is used up for now. Try again later or pick another AI.");
      }
      if (error.status === 404) throw new Error(`The Gemini model "${MODEL}" wasn't found. Check GEMINI_MODEL.`);
      throw new Error(`Gemini returned an error (${error.status}): ${error.message}`);
    }
    throw error;
  }
}
