import type { AIClient } from "@/lib/ai/ai-client";
import type { SourceConfig } from "@/lib/config/sources";
import type { OpportunityIngestProvider } from "@/lib/providers/contracts";
import {
  createEmptyDailyReport,
  toDailyCandidate,
  type DailyReport,
} from "@/lib/report/daily-report";
import { buildDailyReportDraft } from "@/lib/report/daily-report-draft";
import type {
  CaseCard,
  DailyReportDraft,
  RawItem,
  SourceCollectionResult,
  SourceStat,
} from "@/lib/types";
import { deduplicateByUrl, normalizeUrl } from "./deduplicate";
import { filterRawItem } from "./filter";

export interface RunCollectOptions {
  dryRun: boolean;
  sources: SourceConfig[];
  maxItemsPerRun: number;
  now?: () => Date;
}

export interface RunCollectDependencies {
  collectSource(source: SourceConfig): Promise<SourceCollectionResult>;
  aiClient: AIClient;
  ingestProvider?: OpportunityIngestProvider;
  logger?: Pick<Console, "log" | "error">;
}

export interface RunCollectResult {
  report: DailyReport;
  cards: CaseCard[];
  dailyReportDraft: DailyReportDraft;
}

export async function runCollect(
  options: RunCollectOptions,
  deps: RunCollectDependencies,
): Promise<RunCollectResult> {
  const now = options.now ?? (() => new Date());
  const logger = deps.logger ?? console;
  const report = createEmptyDailyReport(options.dryRun, now());
  const rawItems: RawItem[] = [];
  const stats = new Map<string, SourceStat>();

  for (const source of options.sources.filter((item) => item.enabled)) {
    const stat: SourceStat = {
      sourceId: source.id,
      sourceName: source.name,
      collected: 0,
      passed: 0,
      skipped: 0,
      errors: 0,
    };
    stats.set(source.id, stat);
    try {
      const result = await deps.collectSource(source);
      stat.collected = result.items.length;
      stat.skipped += result.skipped.length;
      stat.errors += result.errors.length;
      rawItems.push(...result.items);
      report.errors.push(...result.errors);
      report.errors.push(...result.skipped.map((message) => ({
        scope: "skip",
        sourceId: source.id,
        message,
      })));
      if (source.type === "search") {
        logger.log("搜索结果：", result.items);
      }
    } catch (error) {
      stat.errors += 1;
      report.errors.push({
        scope: "source",
        sourceId: source.id,
        message: error instanceof Error ? error.message : "Unknown source error",
      });
    }
  }

  report.totalCollected = rawItems.length;
  const normalized: RawItem[] = [];
  for (const item of rawItems) {
    try {
      normalized.push({ ...item, url: normalizeUrl(item.url) });
    } catch (error) {
      report.totalFiltered += 1;
      report.errors.push({
        scope: "filter",
        sourceId: item.sourceId,
        message: error instanceof Error ? error.message : "Invalid URL",
      });
    }
  }

  const deduplicated = deduplicateByUrl(normalized);
  report.totalFiltered += deduplicated.duplicates.length;
  const passed: RawItem[] = [];
  for (const item of deduplicated.items) {
    const decision = filterRawItem(item);
    const stat = stats.get(item.sourceId);
    if (!decision.passed) {
      report.totalFiltered += 1;
      if (stat) stat.skipped += 1;
      if (decision.risk === "high") {
        report.errors.push({
          scope: "risk-filter",
          sourceId: item.sourceId,
          message: decision.reason,
        });
      }
      continue;
    }
    if (stat) stat.passed += 1;
    passed.push(item);
  }

  const limited = passed.slice(0, options.maxItemsPerRun);
  report.totalFiltered += Math.max(0, passed.length - limited.length);
  const cards: CaseCard[] = [];
  for (const item of limited) {
    try {
      cards.push(await deps.aiClient.generateCaseCard(item));
    } catch (error) {
      report.errors.push({
        scope: "ai",
        sourceId: item.sourceId,
        message: error instanceof Error ? error.message : "Unknown AI error",
      });
    }
  }
  report.totalPassed = cards.length;

  const sorted = [...cards].sort((left, right) => right.score - left.score);
  report.top10Candidates = sorted.slice(0, 10).map(toDailyCandidate);
  report.recommendedTop3 = sorted
    .filter((card) => card.riskLevel !== "高")
    .slice(0, 3)
    .map(toDailyCandidate);
  report.highRiskItems = sorted
    .filter((card) => card.riskLevel === "高")
    .map(toDailyCandidate);

  const recordIds = new Map<string, string>();
  if (options.dryRun) {
    logger.log("拟写入数据：", cards);
  } else if (!deps.ingestProvider) {
    throw new Error("Data ingest provider is required outside dry-run");
  } else {
    for (const card of cards) {
      try {
        const outcome = await deps.ingestProvider.ingestOpportunity(card);
        recordIds.set(card.sourceUrl, outcome.recordId);
        report.totalWrittenToSupabase += 1;
        if (outcome.action === "inserted") {
          report.totalInserted += 1;
        } else {
          report.duplicateUrls += 1;
          report.machineFieldsUpdated += 1;
          report.manualFieldsPreserved += 1;
        }
        if (outcome.needsJennyComment) {
          report.pendingJennyComments += 1;
        }
      } catch (error) {
        report.errors.push({
          scope: "data-write",
          sourceId: normalized.find((item) => item.url === card.sourceUrl)
            ?.sourceId,
          message: error instanceof Error
            ? error.message
            : "Unknown data write error",
        });
      }
    }
  }

  const dailyReportDraft = buildDailyReportDraft({
    cards,
    recordIds,
    reportDate: report.reportDate,
    totalCollected: report.totalCollected,
  });
  if (options.dryRun) {
    logger.log("拟生成日报：", dailyReportDraft);
  } else {
    try {
      await deps.ingestProvider!.ingestDailyReport(dailyReportDraft);
    } catch (error) {
      report.errors.push({
        scope: "daily-report-write",
        message: error instanceof Error
          ? error.message
          : "Unknown daily report write error",
      });
    }
  }

  report.sourceStats = [...stats.values()];
  return { report, cards, dailyReportDraft };
}
