import { describe, expect, it } from "vitest";
import { collectWeb } from "@/lib/sources/web";

describe("collectWeb", () => {
  it("extracts one public page and does not follow links", async () => {
    const calls: string[] = [];
    const fakeFetch: typeof fetch = async (input) => {
      calls.push(String(input));
      return new Response(`
        <html>
          <head>
            <title>AI 辅助简历优化</title>
            <meta name="description" content="适合转型者的实操方法">
            <meta property="article:published_time" content="2026-06-28T00:00:00Z">
          </head>
          <body><article>正文内容 <a href="/next">下一页</a></article></body>
        </html>
      `, { headers: { "content-type": "text/html; charset=utf-8" } });
    };

    const result = await collectWeb({
      id: "web",
      name: "公开网页",
      type: "web",
      url: "https://example.com/article",
      enabled: true,
    }, fakeFetch);

    expect(result.items[0]).toMatchObject({
      title: "AI 辅助简历优化",
      summary: "适合转型者的实操方法",
      publishedAt: "2026-06-28T00:00:00Z",
    });
    expect(calls).toEqual(["https://example.com/article"]);
  });
});
