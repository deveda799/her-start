import type { SearchSourceConfig } from "@/lib/config/sources";
import type { SearchProvider } from "@/lib/search/search-provider";
import type {
  SearchBudget,
  SourceCollectionResult,
} from "@/lib/types";

export async function collectSearchKeywords(
  keywords: string[],
  provider: SearchProvider,
  budget: SearchBudget,
  source: SearchSourceConfig,
): Promise<SourceCollectionResult> {
  if (!provider.available) {
    return {
      items: [],
      errors: [],
      skipped: [provider.unavailableReason ?? "search provider is unavailable"],
    };
  }

  const result: SourceCollectionResult = { items: [], errors: [], skipped: [] };
  for (const keyword of keywords) {
    if (budget.remaining <= 0) {
      result.skipped.push("daily search query limit reached");
      break;
    }
    budget.remaining -= 1;
    budget.consumed += 1;
    try {
      const items = await provider.search(keyword);
      result.items.push(...items.map((item) => ({
        ...item,
        sourceId: source.id,
        sourceType: "search" as const,
      })));
    } catch (error) {
      result.errors.push({
        scope: "search",
        sourceId: source.id,
        message: error instanceof Error ? error.message : "Unknown search error",
      });
    }
  }
  return result;
}

export function collectSearch(
  source: SearchSourceConfig,
  provider: SearchProvider,
  budget: SearchBudget,
) {
  return collectSearchKeywords(source.keywords, provider, budget, source);
}
