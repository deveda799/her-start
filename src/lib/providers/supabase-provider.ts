import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  CaseCard,
  DailyReportDraft,
  PublicDailyReport,
  PublicDailyReportItem,
  PublicOpportunity,
} from "@/lib/types";
import type {
  OpportunityDataProvider,
  OpportunityIngestProvider,
  OpportunityIngestResult,
  OpportunityListResult,
  OpportunityQuery,
} from "./contracts";

const publicFields = [
  "id",
  "title",
  "source_url",
  "opportunity_type",
  "audiences",
  "time_requirement",
  "skill_threshold",
  "risk_level",
  "ai_assistance",
  "summary",
  "jenny_comment",
  "action_suggestion",
  "published_date",
  "source",
  "tags",
  "score",
  "published_at",
].join(",");

interface PublicRow {
  id: string;
  title: string;
  source_url: string;
  opportunity_type: string;
  audiences: string[];
  time_requirement: string | null;
  skill_threshold: string | null;
  risk_level: string;
  ai_assistance: string | null;
  summary: string;
  jenny_comment: string | null;
  action_suggestion: string | null;
  published_date: string | null;
  source: string;
  tags: string[];
  score: number;
  published_at: string | null;
}

interface IngestRpcRow {
  record_id: string;
  action: "inserted" | "updated";
  needs_jenny_comment: boolean;
}

interface DailyReportRpcRow {
  report_id: string;
  action: "inserted" | "updated";
}

interface DailyReportItemRow {
  id: string;
  opportunity_id: string | null;
  rank: number;
  title: string;
  source: string;
  source_url: string;
  opportunity_type: string;
  audiences: string[];
  skill_level: string | null;
  time_requirement: string | null;
  risk_level: string;
  score: number;
  ai_summary: string;
  reason_for_selection: string;
  action_step: string;
  jenny_comment: string | null;
  jenny_recommended: boolean;
  tags: string[];
}

interface DailyReportRow {
  id: string;
  report_date: string;
  title: string;
  subtitle: string;
  summary: string;
  total_collected: number;
  total_selected: number;
  total_recommended: number;
  total_high_risk: number;
  total_low_barrier: number;
  total_ai_assisted: number;
  trend_analysis: PublicDailyReport["trendAnalysis"];
  action_suggestions: PublicDailyReport["actionSuggestions"];
  jenny_daily_comment: string | null;
  published_at: string | null;
  daily_report_items: DailyReportItemRow[];
}

function toPublicOpportunity(row: PublicRow): PublicOpportunity {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.source_url,
    opportunityType: row.opportunity_type,
    audiences: row.audiences,
    timeRequirement: row.time_requirement,
    skillThreshold: row.skill_threshold,
    riskLevel: row.risk_level,
    aiAssistance: row.ai_assistance,
    summary: row.summary,
    jennyComment: row.jenny_comment,
    actionSuggestion: row.action_suggestion,
    publishedDate: row.published_date,
    source: row.source,
    tags: row.tags,
    score: row.score,
    publishedAt: row.published_at,
  };
}

function reviewedPublicQuery(client: SupabaseClient) {
  return client
    .from("opportunities")
    .select(publicFields, { count: "exact" })
    .eq("status", "published")
    .eq("is_public", true)
    .eq("jenny_comment_status", "approved")
    .not("jenny_comment", "is", null)
    .neq("jenny_comment", "");
}

function toDailyReportItem(row: DailyReportItemRow): PublicDailyReportItem {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    rank: row.rank,
    title: row.title,
    source: row.source,
    sourceUrl: row.source_url,
    opportunityType: row.opportunity_type,
    audiences: row.audiences,
    skillLevel: row.skill_level,
    timeRequirement: row.time_requirement,
    riskLevel: row.risk_level,
    score: row.score,
    aiSummary: row.ai_summary,
    reasonForSelection: row.reason_for_selection,
    actionStep: row.action_step,
    jennyComment: row.jenny_comment,
    jennyRecommended: row.jenny_recommended,
    tags: row.tags,
  };
}

function toPublicDailyReport(row: DailyReportRow): PublicDailyReport {
  return {
    id: row.id,
    reportDate: row.report_date,
    title: row.title,
    subtitle: row.subtitle,
    summary: row.summary,
    totalCollected: row.total_collected,
    totalSelected: row.total_selected,
    totalRecommended: row.total_recommended,
    totalHighRisk: row.total_high_risk,
    totalLowBarrier: row.total_low_barrier,
    totalAiAssisted: row.total_ai_assisted,
    trendAnalysis: row.trend_analysis,
    actionSuggestions: row.action_suggestions,
    jennyDailyComment: row.jenny_daily_comment,
    publishedAt: row.published_at,
    items: (row.daily_report_items ?? [])
      .sort((left, right) => left.rank - right.rank)
      .slice(0, 10)
      .map(toDailyReportItem),
  };
}

function publicDailyReportQuery(client: SupabaseClient) {
  return client
    .from("daily_reports")
    .select(`
      id, report_date, title, subtitle, summary,
      total_collected, total_selected, total_recommended, total_high_risk,
      total_low_barrier, total_ai_assisted, trend_analysis,
      action_suggestions, jenny_daily_comment, published_at,
      daily_report_items (
        id, opportunity_id, rank, title, source, source_url,
        opportunity_type, audiences, skill_level, time_requirement,
        risk_level, score, ai_summary, reason_for_selection, action_step,
        jenny_comment, jenny_recommended, tags
      )
    `)
    .eq("status", "published")
    .eq("is_public", true);
}

export class SupabaseProvider
implements OpportunityDataProvider, OpportunityIngestProvider {
  constructor(
    private readonly readClient?: SupabaseClient,
    private readonly ingestClient?: SupabaseClient,
  ) {}

  static forRead(url: string, anonKey: string): SupabaseProvider {
    return new SupabaseProvider(createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }));
  }

  static forIngest(url: string, serviceRoleKey: string): SupabaseProvider {
    return new SupabaseProvider(undefined, createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }));
  }

  async listPublicOpportunities(
    query: OpportunityQuery,
  ): Promise<OpportunityListResult> {
    if (!this.readClient) throw new Error("Supabase read client is not configured");
    let builder = reviewedPublicQuery(this.readClient);
    if (query.tag) builder = builder.contains("tags", [query.tag]);
    if (query.type) builder = builder.eq("opportunity_type", query.type);
    if (query.risk) builder = builder.eq("risk_level", query.risk);
    if (query.keyword) {
      const keyword = query.keyword.replace(/[,%().]/g, " ").trim();
      if (keyword) {
        builder = builder.or(
          `title.ilike.%${keyword}%,summary.ilike.%${keyword}%`,
        );
      }
    }

    const from = (query.page - 1) * query.pageSize;
    const result = await builder
      .order("published_at", { ascending: false })
      .order("published_date", { ascending: false })
      .range(from, from + query.pageSize - 1);
    if (result.error) {
      throw new Error(`Supabase public query failed: ${result.error.message}`);
    }
    const total = result.count ?? 0;
    return {
      items: ((result.data ?? []) as unknown as PublicRow[])
        .map(toPublicOpportunity),
      page: query.page,
      pageSize: query.pageSize,
      total,
      hasMore: from + query.pageSize < total,
    };
  }

  async getPublicOpportunity(id: string): Promise<PublicOpportunity | null> {
    if (!this.readClient) throw new Error("Supabase read client is not configured");
    const result = await reviewedPublicQuery(this.readClient)
      .eq("id", id)
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase public detail failed: ${result.error.message}`);
    }
    return result.data
      ? toPublicOpportunity(result.data as unknown as PublicRow)
      : null;
  }

  async getLatestPublicDailyReport(
    onOrBeforeDate: string,
  ): Promise<PublicDailyReport | null> {
    if (!this.readClient) throw new Error("Supabase read client is not configured");
    const result = await publicDailyReportQuery(this.readClient)
      .lte("report_date", onOrBeforeDate)
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase daily report query failed: ${result.error.message}`);
    }
    return result.data
      ? toPublicDailyReport(result.data as unknown as DailyReportRow)
      : null;
  }

  async getPublicDailyReportByDate(
    reportDate: string,
  ): Promise<PublicDailyReport | null> {
    if (!this.readClient) throw new Error("Supabase read client is not configured");
    const result = await publicDailyReportQuery(this.readClient)
      .eq("report_date", reportDate)
      .maybeSingle();
    if (result.error) {
      throw new Error(`Supabase daily report query failed: ${result.error.message}`);
    }
    return result.data
      ? toPublicDailyReport(result.data as unknown as DailyReportRow)
      : null;
  }

  async ingestOpportunity(card: CaseCard): Promise<OpportunityIngestResult> {
    if (!this.ingestClient) {
      throw new Error("Supabase ingest client is not configured");
    }
    const result = await this.ingestClient.rpc("ingest_opportunity", {
      p_payload: {
        source_url: card.sourceUrl,
        title: card.title,
        source: card.source,
        published_date: card.publishedDate,
        opportunity_type: card.opportunityType,
        audiences: card.audiences,
        time_requirement: card.timeRequirement,
        skill_threshold: card.skillThreshold,
        risk_level: card.riskLevel,
        ai_assistance: card.aiAssistance,
        summary: card.summary,
        action_suggestion: card.actionSuggestion,
        score: card.score,
        tags: card.tags,
        ai_comment_suggestion: card.jennyComment,
        raw_payload: {
          scoreBreakdown: card.scoreBreakdown,
          riskReason: card.riskReason,
        },
      },
    });
    if (result.error) {
      throw new Error(`Supabase ingest failed: ${result.error.message}`);
    }
    const row = (
      Array.isArray(result.data) ? result.data[0] : result.data
    ) as IngestRpcRow | null;
    if (!row) throw new Error("Supabase ingest returned no result");
    return {
      recordId: row.record_id,
      action: row.action,
      needsJennyComment: row.needs_jenny_comment,
    };
  }

  async ingestDailyReport(
    report: DailyReportDraft,
  ): Promise<{ reportId: string; action: "inserted" | "updated" }> {
    if (!this.ingestClient) {
      throw new Error("Supabase ingest client is not configured");
    }
    const result = await this.ingestClient.rpc("ingest_daily_report", {
      p_report: {
        report_date: report.reportDate,
        title: report.title,
        subtitle: report.subtitle,
        summary: report.summary,
        total_collected: report.totalCollected,
        total_selected: report.totalSelected,
        total_recommended: report.totalRecommended,
        total_high_risk: report.totalHighRisk,
        total_low_barrier: report.totalLowBarrier,
        total_ai_assisted: report.totalAiAssisted,
        trend_analysis: report.trendAnalysis,
        action_suggestions: report.actionSuggestions,
        raw_payload: report.rawPayload,
      },
      p_items: report.items.map((item) => ({
        opportunity_id: item.opportunityId,
        rank: item.rank,
        title: item.title,
        source: item.source,
        source_url: item.sourceUrl,
        opportunity_type: item.opportunityType,
        audiences: item.audiences,
        skill_level: item.skillLevel,
        time_requirement: item.timeRequirement,
        risk_level: item.riskLevel,
        score: item.score,
        ai_summary: item.aiSummary,
        reason_for_selection: item.reasonForSelection,
        action_step: item.actionStep,
        tags: item.tags,
      })),
    });
    if (result.error) {
      throw new Error(`Supabase daily report ingest failed: ${result.error.message}`);
    }
    const row = (
      Array.isArray(result.data) ? result.data[0] : result.data
    ) as DailyReportRpcRow | null;
    if (!row) throw new Error("Supabase daily report ingest returned no result");
    return { reportId: row.report_id, action: row.action };
  }
}
