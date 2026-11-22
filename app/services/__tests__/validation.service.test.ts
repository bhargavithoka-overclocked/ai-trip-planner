import { validateAIResponse } from "../validation.service";

describe("validateAIResponse", () => {
  it("keeps a good answer as it is", () => {
    const result = validateAIResponse({
      summary: "A week in Lisbon",
      days: 7,
      budget: { flights: 600, hotels: 900, food: 300, activities: 200 },
      recommendations: ["Take tram 28"],
    });

    expect(result.summary).toBe("A week in Lisbon");
    expect(result.days).toBe(7);
    expect(result.budget.hotels).toBe(900);
    expect(result.recommendations).toEqual(["Take tram 28"]);
  });

  it("fills in defaults for missing or wrong fields", () => {
    const result = validateAIResponse({ days: -2, budget: { flights: "lots" }, recommendations: [1, "Go early"] });

    expect(result.days).toBe(1);
    expect(result.budget.flights).toBe(0);
    expect(result.recommendations).toEqual(["Go early"]);
  });

  it("keeps the overview details for the Overview tab", () => {
    const result = validateAIResponse({
      summary: "Paris",
      days: 3,
      budget: {},
      recommendations: [],
      overview: {
        bestPlaces: [{ title: "Louvre", description: "Art", highlights: ["Mona Lisa", 5] }],
        foodExperiences: [{ name: "Croissant", description: "Flaky", cuisine: "French" }],
        areasToStay: [{ area: "Le Marais", vibe: "Lively", priceLevel: "$$", why: "Central" }],
        seasonalNotes: { bestTime: "Spring", weather: "Mild" },
        tips: ["Book the Louvre ahead", null],
      },
    });

    expect(result.overview?.bestPlaces[0]).toEqual({ title: "Louvre", description: "Art", highlights: ["Mona Lisa"] });
    expect(result.overview?.areasToStay[0].area).toBe("Le Marais");
    expect(result.overview?.seasonalNotes.crowdLevel).toBe("");
    expect(result.overview?.tips).toEqual(["Book the Louvre ahead"]);
  });

  it("has no overview when the model didn't send one", () => {
    expect(validateAIResponse({ summary: "x" }).overview).toBeUndefined();
  });
});
