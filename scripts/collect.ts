import "dotenv/config";
import { createAIClient } from "@/lib/ai/ai-client";
import { collectSource } from "@/lib/collect/collectors";
import { runCollect } from "@/lib/collect/pipeline";
import { parseRuntimeEnv } from "@/lib/config/env";
import { loadSources } from "@/lib/config/sources";
import { createOpportunityIngestProvider } from "@/lib/providers/provider-factory";
import {
  createEmptyDailyReport,
  printDailyReport,
  writeDailyReport,
} from "@/lib/report/daily-report";
import { createSearchProvider } from "@/lib/search/search-provider";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let fallback = createEmptyDailyReport(dryRun);
  try {
    const env = parseRuntimeEnv(process.env, dryRun ? "collect-dry" : "collect");
    const sources = await loadSources("config/sources.json");
    const searchProvider = createSearchProvider(env.braveSearchApiKey);
    const searchBudget = {
      remaining: env.maxDailySearchQueries,
      consumed: 0,
    };
    const aiClient = env.aiProvider === "deepseek"
      ? createAIClient({
          provider: "deepseek",
          apiKey: env.deepseekApiKey!,
          baseUrl: env.deepseekBaseUrl,
          model: env.deepseekModel,
        })
      : createAIClient({
          provider: "openai",
          apiKey: env.openaiApiKey!,
          model: env.openaiModel,
        });
    const ingestProvider = dryRun
      ? undefined
      : await createOpportunityIngestProvider(env);
    const result = await runCollect({
      dryRun,
      sources,
      maxItemsPerRun: env.maxItemsPerRun,
    }, {
      collectSource: (source) => collectSource(source, {
        fetchImpl: fetch,
        searchProvider,
        searchBudget,
      }),
      aiClient,
      ingestProvider,
    });
    fallback = result.report;
  } catch (error) {
    fallback.errors.push({
      scope: "startup",
      message: error instanceof Error ? error.message : "Unknown startup error",
    });
    process.exitCode = 1;
  } finally {
    await writeDailyReport(fallback);
    printDailyReport(fallback);
  }
}

void main();
