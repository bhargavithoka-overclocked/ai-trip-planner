const generateContent = jest.fn();

jest.mock("@google/genai", () => {
  class ApiError extends Error {
    status: number;
    constructor({ message, status }: { message: string; status: number }) {
      super(message);
      this.status = status;
    }
  }
  return { ApiError, GoogleGenAI: jest.fn(() => ({ models: { generateContent } })) };
});

import { ApiError } from "@google/genai";
import { callGemini } from "../gemini.service";

describe("callGemini", () => {
  beforeEach(() => {
    generateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("returns the checked plan", async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({ summary: "Lisbon", days: 4, budget: { hotels: 400 }, recommendations: ["Try pastel de nata"] }),
    });

    const plan = await callGemini("4 days in Lisbon", "Overview");
    expect(plan.summary).toBe("Lisbon");
    expect(plan.budget).toEqual({ flights: 0, hotels: 400, food: 0, activities: 0 });
    expect(generateContent.mock.calls[0][0].config.responseMimeType).toBe("application/json");
  });

  it("says how to set it up when there's no key", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(callGemini("Rome", "Overview")).rejects.toThrow("Add GEMINI_API_KEY");
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("explains a rejected key", async () => {
    generateContent.mockRejectedValue(new ApiError({ message: "API key not valid", status: 400 }));
    await expect(callGemini("Rome", "Overview")).rejects.toThrow("Gemini keys start with AIza");
  });

  it("explains when the free tier limit is used up", async () => {
    generateContent.mockRejectedValue(new ApiError({ message: "Quota exceeded", status: 429 }));
    await expect(callGemini("Rome", "Overview")).rejects.toThrow("free tier limit");
  });
});
