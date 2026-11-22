import { fetchAIResponse } from "../ai.service";

function mockFetch(status: number, body: object) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: "",
    json: async () => body,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("fetchAIResponse", () => {
  it("shows the server's own error message and doesn't retry", async () => {
    const fetchMock = mockFetch(500, { message: "OPENAI_API_KEY is not set" });

    await expect(fetchAIResponse("3 days in Rome", "Overview")).rejects.toThrow("OPENAI_API_KEY is not set");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the plan when the server answers", async () => {
    const plan = { summary: "Rome", days: 3, budget: { flights: 1, hotels: 1, food: 1, activities: 1 }, recommendations: [] };
    mockFetch(200, plan);

    await expect(fetchAIResponse("3 days in Rome, again", "Overview")).resolves.toEqual(plan);
  });
});
