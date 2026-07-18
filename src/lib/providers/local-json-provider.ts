import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  CaseCard,
  DailyReportDraft,
  PublicDailyReport,
  PublicOpportunity,
} from "@/lib/types";
import type {
  DailyReportRecord,
  OpportunityDataProvider,
  OpportunityIngestProvider,
  OpportunityIngestResult,
  OpportunityListResult,
  OpportunityQuery,
  OpportunityRecord,
} from "./contracts";

function isReviewedPublic(row: OpportunityRecord): boolean {
  return row.status === "published"
    && row.isPublic
    && row.jennyCommentStatus === "approved"
    && Boolean(row.jennyComment?.trim());
}

function toPublicOpportunity(row: OpportunityRecord): PublicOpportunity {
  const {
    status: _status,
    isPublic: _isPublic,
    jennyCommentStatus: _jennyCommentStatus,
    jennyCommentUpdatedAt: _jennyCommentUpdatedAt,
    reviewNote: _reviewNote,
    aiCommentSuggestion: _aiCommentSuggestion,
    rawPayload: _rawPayload,
    lastSyncedAt: _lastSyncedAt,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...publicRow
  } = row;
  return publicRow;
}

function machineFields(card: CaseCard, now: string) {
  return {
    title: card.title,
    source: card.source,
    publishedDate: card.publishedDate,
    opportunityType: card.opportunityType,
    audiences: card.audiences,
    timeRequirement: card.timeRequirement,
    skillThreshold: card.skillThreshold,
    riskLevel: card.riskLevel,
    aiAssistance: card.aiAssistance,
    summary: card.summary,
    actionSuggestion: card.actionSuggestion,
    score: card.score,
    tags: card.tags,
    aiCommentSuggestion: card.jennyComment,
    rawPayload: {
      scoreBreakdown: card.scoreBreakdown,
      riskReason: card.riskReason,
    },
    lastSyncedAt: now,
    updatedAt: now,
  };
}

export class LocalJsonProvider
implements OpportunityDataProvider, OpportunityIngestProvider {
  constructor(
    private readonly rows: OpportunityRecord[] = [],
    private readonly filePath?: string,
    private readonly now: () => Date = () => new Date(),
    private readonly reports: DailyReportRecord[] = [],
  ) {}

  static async fromFile(path: string): Promise<LocalJsonProvider> {
    try {
      const parsed = JSON.parse(await readFile(path, "utf8")) as
        | OpportunityRecord[]
        | {
            opportunities?: OpportunityRecord[];
            reports?: DailyReportRecord[];
          };
      return Array.isArray(parsed)
        ? new LocalJsonProvider(parsed, path)
        : new LocalJsonProvider(
            parsed.opportunities ?? [],
            path,
            () => new Date(),
            parsed.reports ?? [],
          );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return new LocalJsonProvider([], path);
      }
      throw error;
    }
  }

  async listPublicOpportunities(
    query: OpportunityQuery,
  ): Promise<OpportunityListResult> {
    const keyword = query.keyword?.toLocaleLowerCase();
    const filtered = this.rows.filter((row) => {
      if (!isReviewedPublic(row)) return false;
      if (query.tag && !row.tags.includes(query.tag)) return false;
      if (query.type && row.opportunityType !== query.type) return false;
      if (query.risk && row.riskLevel !== query.risk) return false;
      if (keyword) {
        const searchable = `${row.title} ${row.summary} ${row.source}`
          .toLocaleLowerCase();
        if (!searchable.includes(keyword)) return false;
      }
      return true;
    }).sort((left, right) =>
      (right.publishedAt ?? right.publishedDate ?? "")
        .localeCompare(left.publishedAt ?? left.publishedDate ?? ""));
    const from = (query.page - 1) * query.pageSize;
    return {
      items: filtered.slice(from, from + query.pageSize).map(toPublicOpportunity),
      page: query.page,
      pageSize: query.pageSize,
      total: filtered.length,
      hasMore: from + query.pageSize < filtered.length,
    };
  }

  async getPublicOpportunity(id: string): Promise<PublicOpportunity | null> {
    const row = this.rows.find((item) => item.id === id);
    return row && isReviewedPublic(row) ? toPublicOpportunity(row) : null;
  }

  async getLatestPublicDailyReport(
    onOrBeforeDate: string,
  ): Promise<PublicDailyReport | null> {
    const row = this.reports
      .filter((report) =>
        report.status === "published"
        && report.isPublic
        && report.reportDate <= onOrBeforeDate)
      .sort((left, right) => right.reportDate.localeCompare(left.reportDate))[0];
    return row ? this.toPublicDailyReport(row) : null;
  }

  async getPublicDailyReportByDate(
    reportDate: string,
  ): Promise<PublicDailyReport | null> {
    const row = this.reports.find((report) =>
      report.reportDate === reportDate
      && report.status === "published"
      && report.isPublic);
    return row ? this.toPublicDailyReport(row) : null;
  }

  async ingestOpportunity(card: CaseCard): Promise<OpportunityIngestResult> {
    const now = this.now().toISOString();
    const existing = this.rows.find((row) => row.sourceUrl === card.sourceUrl);
    if (existing) {
      Object.assign(existing, machineFields(card, now));
      await this.persist();
      return {
        recordId: existing.id,
        action: "updated",
        needsJennyComment: existing.jennyCommentStatus !== "approved"
          || !existing.jennyComment?.trim(),
      };
    }

    const record: OpportunityRecord = {
      id: randomUUID(),
      sourceUrl: card.sourceUrl,
      ...machineFields(card, now),
      jennyComment: null,
      status: "pending",
      isPublic: false,
      jennyCommentStatus: "ai_draft",
      jennyCommentUpdatedAt: null,
      reviewNote: null,
      publishedAt: null,
      createdAt: now,
    };
    this.rows.push(record);
    await this.persist();
    return {
      recordId: record.id,
      action: "inserted",
      needsJennyComment: true,
    };
  }

  async ingestDailyReport(
    draft: DailyReportDraft,
  ): Promise<{ reportId: string; action: "inserted" | "updated" }> {
    const now = this.now().toISOString();
    const existing = this.reports.find(
      (report) => report.reportDate === draft.reportDate,
    );
    if (existing) {
      Object.assign(existing, {
        title: draft.title,
        subtitle: draft.subtitle,
        summary: draft.summary,
        totalCollected: draft.totalCollected,
        totalSelected: draft.totalSelected,
        totalRecommended: draft.totalRecommended,
        totalHighRisk: draft.totalHighRisk,
        totalLowBarrier: draft.totalLowBarrier,
        totalAiAssisted: draft.totalAiAssisted,
        trendAnalysis: draft.trendAnalysis,
        actionSuggestions: draft.actionSuggestions,
        rawPayload: draft.rawPayload,
        updatedAt: now,
      });
      for (const item of draft.items) {
        const stored = existing.items.find(
          (candidate) => candidate.sourceUrl === item.sourceUrl,
        );
        if (stored) {
          Object.assign(stored, item);
        } else {
          existing.items.push({
            ...item,
            id: randomUUID(),
            jennyComment: null,
            jennyRecommended: false,
          });
        }
      }
      await this.persist();
      return { reportId: existing.id, action: "updated" };
    }

    const record: DailyReportRecord = {
      ...draft,
      id: randomUUID(),
      items: draft.items.map((item) => ({
        ...item,
        id: randomUUID(),
        jennyComment: null,
        jennyRecommended: false,
      })),
      jennyDailyComment: null,
      publishedAt: null,
      status: "pending",
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };
    this.reports.push(record);
    await this.persist();
    return { reportId: record.id, action: "inserted" };
  }

  private toPublicDailyReport(row: DailyReportRecord): PublicDailyReport {
    const {
      status: _status,
      isPublic: _isPublic,
      rawPayload: _rawPayload,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...report
    } = row;
    return {
      ...report,
      items: [...report.items]
        .sort((left, right) => left.rank - right.rank)
        .slice(0, 10),
    };
  }

  private async persist(): Promise<void> {
    if (!this.filePath) return;
    await mkdir(dirname(this.filePath), { recursive: true });
    const data = this.reports.length > 0
      ? { opportunities: this.rows, reports: this.reports }
      : this.rows;
    await writeFile(this.filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}
