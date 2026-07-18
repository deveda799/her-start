import { describe, expect, it } from "vitest";
import { BraveSearchProvider } from "@/lib/search/brave-search-provider";
import { NoopSearchProvider } from "@/lib/search/noop-search-provider";
import { createSearchProvider } from "@/lib/search/search-provider";
import { collectSearchKeywords } from "@/lib/sources/search";
import type { SearchSourceConfig } from "@/lib/config/sources";
import type { SearchProvider } from "@/lib/search/search-provider";

const source: SearchSourceConfig = {
  id: "search-source",
  name: "职业搜索",
  type: "search",
  provider: "brave",
  keywords: ["first"],
  enabled: true,
};

describe("SearchProvider", () => {
  it("uses Noop when the Brave key is absent", async () => {
    const provider = createSearchProvider(undefined, fetch);

    expect(provider).toBeInstanceOf(NoopSearchProvider);
    expect(provider.available).toBe(false);
    expect(await provider.search("宝妈 AI")).toEqual([]);
  });

  it("maps Brave web results without fetching result pages", async () => {
    const calls: string[] = [];
    const fakeFetch: typeof fetch = async (input, init) => {
      calls.push(String(input));
      expect(new Headers(init?.headers).get("X-Subscription-Token")).toBe("test-key");
      return Response.json({
        web: {
          results: [{
            title: "远程顾问机会",
            url: "https://example.com/a",
            description: "适合有经验的转型者",
            profile: { long_name: "Example" },
            age: "2026-06-28T00:00:00Z",
          }],
        },
      });
    };
    const provider = new BraveSearchProvider("test-key", fakeFetch);

    const result = await provider.search("35+ 女性");

    expect(result[0]).toMatchObject({
      title: "远程顾问机会",
      url: "https://example.com/a",
      summary: "适合有经验的转型者",
      source: "Example",
    });
    expect(calls).toHaveLength(1);
  });

  it("stops at the daily limit and continues after one query fails", async () => {
    const provider: SearchProvider = {
      available: true,
      search: async (query) => {
        if (query === "bad") throw new Error("search unavailable");
        return [{
          title: query,
          url: `https://example.com/${query}`,
          summary: "公开搜索摘要",
          source: "Brave Search",
          publishedAt: null,
          sourceId: "brave",
          sourceType: "search",
        }];
      },
    };

    const result = await collectSearchKeywords(
      ["first", "bad", "third", "fourth"],
      provider,
      { remaining: 3, consumed: 0 },
      source,
    );

    expect(result.items.map((item) => item.title)).toEqual(["first", "third"]);
    expect(result.errors).toHaveLength(1);
    expect(result.skipped).toContain("daily search query limit reached");
  });
});
