import { describe, expect, it } from "vitest";
import { collectManual } from "@/lib/sources/manual";

describe("collectManual", () => {
  it("maps configured links without network access", async () => {
    const result = await collectManual({
      id: "manual",
      name: "人工精选",
      type: "manual",
      enabled: true,
      items: [{
        title: "远程项目经理",
        url: "https://example.com/job",
        summary: "每周投入十小时",
        publishedAt: "2026-06-28T00:00:00.000Z",
      }],
    });

    expect(result.items[0]).toMatchObject({
      title: "远程项目经理",
      source: "人工精选",
      sourceId: "manual",
      sourceType: "manual",
    });
  });
});
