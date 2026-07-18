import type { ManualSourceConfig } from "@/lib/config/sources";
import type { SourceCollectionResult } from "@/lib/types";

export async function collectManual(
  source: ManualSourceConfig,
): Promise<SourceCollectionResult> {
  return {
    items: source.items.map((item) => ({
      title: item.title,
      url: item.url,
      summary: item.summary,
      source: source.name,
      publishedAt: item.publishedAt ?? null,
      sourceId: source.id,
      sourceType: "manual",
    })),
    errors: [],
    skipped: [],
  };
}
