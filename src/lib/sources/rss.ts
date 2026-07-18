import Parser from "rss-parser";
import type { RssSourceConfig } from "@/lib/config/sources";
import type { SourceCollectionResult } from "@/lib/types";

interface FeedParser {
  parseURL(url: string): Promise<{
    items?: Array<{
      title?: string;
      link?: string;
      contentSnippet?: string;
      content?: string;
      isoDate?: string;
      pubDate?: string;
    }>;
  }>;
}

export async function collectRss(
  source: RssSourceConfig,
  parser: FeedParser = new Parser(),
): Promise<SourceCollectionResult> {
  const feed = await parser.parseURL(source.url);
  const skipped: string[] = [];
  const items = [];

  for (const item of feed.items ?? []) {
    if (!item.link) {
      skipped.push("RSS item has no link");
      continue;
    }
    items.push({
      title: item.title ?? "",
      url: item.link,
      summary: item.contentSnippet ?? item.content ?? "",
      source: source.name,
      publishedAt: item.isoDate ?? item.pubDate ?? null,
      sourceId: source.id,
      sourceType: "rss" as const,
    });
  }

  return { items, errors: [], skipped };
}
