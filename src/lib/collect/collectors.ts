import Parser from "rss-parser";
import type { SourceConfig } from "@/lib/config/sources";
import type { SearchProvider } from "@/lib/search/search-provider";
import type { SearchBudget } from "@/lib/types";
import { collectManual } from "@/lib/sources/manual";
import { collectRss } from "@/lib/sources/rss";
import { collectSearch } from "@/lib/sources/search";
import { collectWeb } from "@/lib/sources/web";

export interface CollectorDependencies {
  fetchImpl: typeof fetch;
  searchProvider: SearchProvider;
  searchBudget: SearchBudget;
  rssParser?: Parser;
}

export function collectSource(source: SourceConfig, deps: CollectorDependencies) {
  switch (source.type) {
    case "rss":
      return collectRss(source, deps.rssParser);
    case "web":
      return collectWeb(source, deps.fetchImpl);
    case "manual":
      return collectManual(source);
    case "search":
      return collectSearch(source, deps.searchProvider, deps.searchBudget);
  }
}
