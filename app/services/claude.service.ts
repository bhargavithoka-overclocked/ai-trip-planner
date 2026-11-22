import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt } from "./prompt.service";
import { parseModelJson, validateAIResponse } from "./validation.service";
import { AIResult } from "@/app/types/travel.types";

const MODEL = "claude-opus-5-5";

/**
 * Create the Claude client lazily, same as the OpenAI one, so a missing
 * key only matters when someone actually picks Claude.
 */
function getClient() {
  return new Anthropic({ timeout: 60000 });
}

/**
 * Same job as callOpenAI: one trip-planning prompt in, one checked result out.
 */
export async function callClaude(query: string, tab: string): Promise<AIResult> {
  let response: Anthropic.Beta.BetaMessage;

  try {
    response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // a short JSON answer doesn't need much thinking, and low effort keeps it quick
      output_config: { effort: "low" },
      // if Claude declines a request, let the API retry it on another model
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: "You are a helpful travel planning assistant. Reply with JSON only.",
      messages: [{ role: "user", content: buildPrompt(query, tab) }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error("Claude isn't set up. Add ANTHROPIC_API_KEY to .env.local and restart the app.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error("Claude is getting too many requests right now. Try again in a moment.");
    }
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude returned an error (${error.status ?? "no status"}): ${error.message}`);
    }
    // the SDK throws a plain Error, before sending anything, when it finds no key
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Claude isn't set up. Add ANTHROPIC_API_KEY to .env.local and restart the app. (${reason})`);
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Claude couldn't help with that request. Try wording it differently.");
  }

  const text = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return validateAIResponse(parseModelJson(text));
}
