import type { RawItem } from "@/lib/types";
import { BraveSearchProvider } from "./brave-search-provider";
import { NoopSearchProvider } from "./noop-search-provider";

export interface SearchProvider {
  readonly available: boolean;
  readonly unavailableReason?: string;
  search(query: string): Promise<RawItem[]>;
}

export function createSearchProvider(
  braveApiKey: string | undefined,
  fetchImpl: typeof fetch = fetch,
): SearchProvider {
  return braveApiKey
    ? new BraveSearchProvider(braveApiKey, fetchImpl)
    : new NoopSearchProvider();
}
