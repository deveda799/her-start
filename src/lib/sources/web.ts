import { load } from "cheerio";
import type { WebSourceConfig } from "@/lib/config/sources";
import type { SourceCollectionResult } from "@/lib/types";

export async function collectWeb(
  source: WebSourceConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SourceCollectionResult> {
  const response = await fetchImpl(source.url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "jenny-career-intelligence/0.1",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Public page request failed with status ${response.status}`);
  }

  const $ = load(await response.text());
  $("script, style, noscript").remove();
  const title = $("meta[property='og:title']").attr("content")
    ?? $("title").first().text().trim()
    ?? $("h1").first().text().trim();
  const description = $("meta[name='description']").attr("content")
    ?? $("meta[property='og:description']").attr("content")
    ?? "";
  const bodyText = $("article").first().text().replace(/\s+/g, " ").trim()
    || $("body").text().replace(/\s+/g, " ").trim();
  const publishedAt = $("meta[property='article:published_time']").attr("content")
    ?? $("time[datetime]").first().attr("datetime")
    ?? null;

  return {
    items: [{
      title,
      url: source.url,
      summary: description || bodyText.slice(0, 1_500),
      source: source.name,
      publishedAt,
      sourceId: source.id,
      sourceType: "web",
    }],
    errors: [],
    skipped: [],
  };
}
