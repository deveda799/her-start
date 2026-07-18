import { describe, expect, it } from "vitest";
import { collectRss } from "@/lib/sources/rss";

describe("collectRss", () => {
  it("normalizes feed entries", async () => {
    const parser = {
      parseURL: async () => ({
        items: [{
          title: "女性重返职场案例",
          link: "https://example.com/story",
          contentSnippet: "从兼职顾问开始",
          isoDate: "2026-06-28T00:00:00.000Z",
        }],
      }),
    };

    const result = await collectRss({
      id: "rss",
      name: "公开 RSS",
      type: "rss",
      url: "https://example.com/feed.xml",
      enabled: true,
    }, parser);

    expect(result.items[0]).toMatchObject({
      title: "女性重返职场案例",
      url: "https://example.com/story",
      summary: "从兼职顾问开始",
      source: "公开 RSS",
    });
  });
});
