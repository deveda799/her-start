import { describe, expect, it } from "vitest";
import { deduplicateByUrl, normalizeUrl } from "@/lib/collect/deduplicate";
import type { RawItem } from "@/lib/types";

function raw(url: string): RawItem {
  return {
    title: "远程顾问机会",
    url,
    summary: "适合有经验的职场转型者",
    source: "测试",
    publishedAt: null,
    sourceId: "test",
    sourceType: "manual",
  };
}

describe("URL deduplication", () => {
  it("removes tracking parameters and normalizes the URL", () => {
    expect(normalizeUrl("https://Example.com/post/?utm_source=x&b=2&a=1#part"))
      .toBe("https://example.com/post?a=1&b=2");
  });

  it("deduplicates only by normalized URL", () => {
    const result = deduplicateByUrl([
      raw("https://Example.com/post/?utm_source=x#part"),
      raw("https://example.com/post"),
    ]);

    expect(result.items).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.items[0].url).toBe("https://example.com/post");
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeUrl("file:///secret")).toThrow(/http/);
  });
});
