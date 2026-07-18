import type {
  CaseCard,
  DailyReportDraft,
  PublicDailyReport,
  PublicOpportunity,
} from "@/lib/types";

export interface OpportunityQuery {
  page: number;
  pageSize: number;
  tag?: string;
  type?: string;
  risk?: string;
  keyword?: string;
}

export interface OpportunityListResult {
  items: PublicOpportunity[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface OpportunityDataProvider {
  listPublicOpportunities(
    query: OpportunityQuery,
  ): Promise<OpportunityListResult>;
  getPublicOpportunity(id: string): Promise<PublicOpportunity | null>;
  getLatestPublicDailyReport(
    onOrBeforeDate: string,
  ): Promise<PublicDailyReport | null>;
  getPublicDailyReportByDate(
    reportDate: string,
  ): Promise<PublicDailyReport | null>;
}

export interface OpportunityIngestResult {
  recordId: string;
  action: "inserted" | "updated";
  needsJennyComment: boolean;
}

export interface OpportunityIngestProvider {
  ingestOpportunity(card: CaseCard): Promise<OpportunityIngestResult>;
  ingestDailyReport(
    report: DailyReportDraft,
  ): Promise<{ reportId: string; action: "inserted" | "updated" }>;
}

export interface OpportunityRecord extends PublicOpportunity {
  status: "pending" | "published" | "unpublished";
  isPublic: boolean;
  jennyCommentStatus: "ai_draft" | "approved";
  jennyCommentUpdatedAt: string | null;
  reviewNote: string | null;
  aiCommentSuggestion: string | null;
  rawPayload: Record<string, unknown>;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportRecord extends PublicDailyReport {
  status: "pending" | "published" | "unpublished";
  isPublic: boolean;
  rawPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
