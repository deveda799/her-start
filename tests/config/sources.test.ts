import { describe, expect, it } from "vitest";
import { parseSources } from "@/lib/config/sources";

describe("parseSources", () => {
  it("parses all supported source types", () => {
    const parsed = parseSources([
      { id: "rss-1", name: "RSS", type: "rss", url: "https://example.com/feed.xml" },
      { id: "web-1", name: "Web", type: "web", url: "https://example.com/post" },
      {
        id: "manual-1",
        name: "Manual",
        type: "manual",
        items: [{ url: "https://example.com/job", title: "远程工作" }],
      },
      {
        id: "search-1",
        name: "Search",
        type: "search",
        provider: "brave",
        keywords: ["宝妈 AI"],
      },
    ]);

    expect(parsed).toHaveLength(4);
  });

  it("rejects a search source without keywords", () => {
    expect(() => parseSources([
      { id: "search-1", name: "Search", type: "search", provider: "brave" },
    ])).toThrow();
  });
});
