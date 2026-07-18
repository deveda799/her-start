import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  CaseCard,
  ReportError,
  SourceStat,
} from "@/lib/types";

export const REPORT_TIMEZONE = "Asia/Shanghai";

export interface DailyCandidate {
  title: string;
  sourceUrl: string;
  score: number;
  riskLevel: string;
  reason: string;
}

export interface DailyReport {
  reportDate: string;
  timezone: typeof REPORT_TIMEZONE;
  dryRun: boolean;
  totalCollected: number;
  totalFiltered: number;
  totalPassed: number;
  totalWrittenToSupabase: number;
  totalInserted: number;
  duplicateUrls: number;
  machineFieldsUpdated: number;
  manualFieldsPreserved: number;
  pendingJennyComments: number;
  top10Candidates: DailyCandidate[];
  recommendedTop3: DailyCandidate[];
  highRiskItems: DailyCandidate[];
  sourceStats: SourceStat[];
  errors: ReportError[];
  generatedAt: string;
}

export function getShanghaiDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function createEmptyDailyReport(
  dryRun: boolean,
  now: Date = new Date(),
): DailyReport {
  return {
    reportDate: getShanghaiDate(now),
    timezone: REPORT_TIMEZONE,
    dryRun,
    totalCollected: 0,
    totalFiltered: 0,
    totalPassed: 0,
    totalWrittenToSupabase: 0,
    totalInserted: 0,
    duplicateUrls: 0,
    machineFieldsUpdated: 0,
    manualFieldsPreserved: 0,
    pendingJennyComments: 0,
    top10Candidates: [],
    recommendedTop3: [],
    highRiskItems: [],
    sourceStats: [],
    errors: [],
    generatedAt: now.toISOString(),
  };
}

export function toDailyCandidate(card: CaseCard): DailyCandidate {
  return {
    title: card.title,
    sourceUrl: card.sourceUrl,
    score: card.score,
    riskLevel: card.riskLevel,
    reason: card.jennyComment || card.riskReason,
  };
}

export async function writeDailyReport(
  report: DailyReport,
  outputDir = "output",
): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const path = join(outputDir, `daily-report-${report.reportDate}.json`);
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}

export async function readDailyReport(path: string): Promise<DailyReport> {
  return JSON.parse(await readFile(path, "utf8")) as DailyReport;
}

export function printDailyReport(
  report: DailyReport,
  logger: Pick<Console, "log"> = console,
): void {
  logger.log(`日报日期：${report.reportDate} (${report.timezone})`);
  logger.log(`今日采集数量：${report.totalCollected}`);
  logger.log(`通过筛选数量：${report.totalPassed}`);
  logger.log(`写入数据源数量：${report.totalWrittenToSupabase}`);
  logger.log(`新增记录数量：${report.totalInserted}`);
  logger.log(`重复 URL 数量：${report.duplicateUrls}`);
  logger.log(`更新机器字段数量：${report.machineFieldsUpdated}`);
  logger.log(`保留人工字段数量：${report.manualFieldsPreserved}`);
  logger.log(`待珍妮点评数量：${report.pendingJennyComments}`);
  logger.log("Top10 候选：", report.top10Candidates);
  logger.log("推荐发布 Top3：", report.recommendedTop3);
  logger.log("高风险内容提醒：", report.highRiskItems);
  logger.log("错误/跳过原因：", report.errors);
}
