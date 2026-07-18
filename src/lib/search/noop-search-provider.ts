import type { SearchProvider } from "./search-provider";

export class NoopSearchProvider implements SearchProvider {
  readonly available = false;
  readonly unavailableReason = "BRAVE_SEARCH_API_KEY is not configured";

  async search() {
    return [];
  }
}
