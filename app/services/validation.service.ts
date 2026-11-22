import { Budget, AIResult } from "@/app/types/travel.types";

const DEFAULT_RESULT: AIResult = {
  summary: "Unable to generate a travel plan.",
  days: 1,
  budget: {
    flights: 0,
    hotels: 0,
    food: 0,
    activities: 0,
  },
  recommendations: [],
};

/** Models sometimes wrap their JSON in a markdown code block. */
export function parseModelJson(text: string): unknown {
  let clean = (text || "{}").trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(clean);
}

export function validateAIResponse(data: any): AIResult {
  try {
    return {
      summary:
        typeof data.summary === "string"
          ? data.summary
          : DEFAULT_RESULT.summary,

      days:
        typeof data.days === "number" && data.days > 0
          ? data.days
          : DEFAULT_RESULT.days,

      budget: {
        flights:
          typeof data.budget?.flights === "number"
            ? data.budget.flights
            : 0,
        hotels:
          typeof data.budget?.hotels === "number"
            ? data.budget.hotels
            : 0,
        food:
          typeof data.budget?.food === "number"
            ? data.budget.food
            : 0,
        activities:
          typeof data.budget?.activities === "number"
            ? data.budget.activities
            : 0,
      },

      recommendations: Array.isArray(data.recommendations)
        ? data.recommendations.filter((r: unknown): r is string => typeof r === "string")
        : [],

      overview: validateOverview(data.overview),
    };
  } catch {
    return DEFAULT_RESULT;
  }
}

type Loose = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value : "");
const textList = (value: unknown) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
const objectList = (value: unknown): Loose[] =>
  Array.isArray(value) ? value.filter((v): v is Loose => !!v && typeof v === "object") : [];

// The Overview tab is built from this part of the answer, so keep it
// (it used to be dropped here) but clean up anything the model got wrong.
function validateOverview(value: unknown): AIResult["overview"] {
  if (!value || typeof value !== "object") return undefined;
  const overview = value as Loose;
  const seasonal = (overview.seasonalNotes ?? {}) as Loose;

  return {
    bestPlaces: objectList(overview.bestPlaces).map((place) => ({
      title: text(place.title),
      description: text(place.description),
      highlights: textList(place.highlights),
    })),
    foodExperiences: objectList(overview.foodExperiences).map((food) => ({
      name: text(food.name),
      description: text(food.description),
      cuisine: text(food.cuisine),
    })),
    areasToStay: objectList(overview.areasToStay).map((area) => ({
      area: text(area.area),
      vibe: text(area.vibe),
      priceLevel: text(area.priceLevel),
      why: text(area.why),
    })),
    seasonalNotes: {
      bestTime: text(seasonal.bestTime),
      weather: text(seasonal.weather),
      crowdLevel: text(seasonal.crowdLevel),
    },
    tips: textList(overview.tips),
  };
}
