import { z } from "zod";
import type { SearchProvider } from "./search-provider";

const braveResponseSchema = z.object({
  web: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
      description: z.string().optional(),
      age: z.string().optional(),
      profile: z.object({
        long_name: z.string().optional(),
      }).optional(),
    })).default([]),
  }).optional(),
});

export class BraveSearchProvider implements SearchProvider {
  readonly available = true;

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async search(query: string) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", "10");
    url.searchParams.set("search_lang", "zh-hans");

    const response = await this.fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.apiKey,
        "User-Agent": "jenny-career-intelligence/0.1",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Brave Search request failed with status ${response.status}`);
    }

    const data = braveResponseSchema.parse(await response.json());
    return (data.web?.results ?? []).map((item) => ({
      title: item.title,
      url: item.url,
      summary: item.description ?? "",
      source: item.profile?.long_name ?? "Brave Search",
      publishedAt: item.age ?? null,
      sourceId: "brave",
      sourceType: "search" as const,
    }));
  }
}
