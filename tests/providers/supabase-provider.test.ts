import { describe, expect, it, vi } from "vitest";
import { SupabaseProvider } from "@/lib/providers/supabase-provider";
import type { CaseCard, DailyReportDraft } from "@/lib/types";

const card: CaseCard = {
  title: "远程项目顾问机会",
  source: "公开来源",
  sourceUrl: "https://example.com/opportunity",
  publishedDate: "2026-06-29",
  opportunityType: "工作机会",
  audiences: ["35+女性", "职场转型者"],
  timeRequirement: "每周10小时",
  skillThreshold: "项目管理经验",
  riskLevel: "低",
  aiAssistance: "整理方案",
  summary: "从小项目开始验证。",
  jennyComment: "AI 点评建议",
  actionSuggestion: "今天列出三个服务。",
  tags: ["远程", "顾问"],
  scoreBreakdown: {
    audienceFit: 25,
    painStrength: 20,
    actionability: 20,
    timeliness: 10,
    riskControl: 8,
  },
  score: 83,
  riskReason: "核实付款条款",
  status: "待审核",
  createdAt: "2026-06-30T00:00:00.000Z",
};

const reportDraft: DailyReportDraft = {
  reportDate: "2026-07-02",
  title: "珍妮35+女性职业机会日报",
  subtitle: "每日职业机会情报",
  summary: "今日入选1条。",
  totalCollected: 3,
  totalSelected: 1,
  totalRecommended: 1,
  totalHighRisk: 0,
  totalLowBarrier: 1,
  totalAiAssisted: 1,
  trendAnalysis: {
    opportunityTypes: { 工作机会: 1 },
    audiences: { 宝妈: 1 },
    riskLevels: { 低: 1 },
    observations: ["灵活工作值得关注"],
    focusDirections: ["远程工作"],
    riskWarnings: [],
  },
  actionSuggestions: {
    jobSeeker: "更新简历",
    fullTimeMom: "查看灵活机会",
    sideHustle: "验证一个方向",
    aiEfficiency: "尝试AI整理简历",
  },
  items: [{
    opportunityId: "00000000-0000-0000-0000-000000000001",
    rank: 1,
    title: card.title,
    source: card.source,
    sourceUrl: card.sourceUrl,
    opportunityType: card.opportunityType,
    audiences: card.audiences,
    skillLevel: card.skillThreshold,
    timeRequirement: card.timeRequirement,
    riskLevel: card.riskLevel,
    score: card.score,
    aiSummary: card.summary,
    reasonForSelection: card.jennyComment,
    actionStep: card.actionSuggestion,
    tags: card.tags,
  }],
  rawPayload: { generatedBy: "collect" },
};

describe("SupabaseProvider", () => {
  it("writes a daily report through the protected RPC without editorial fields", async () => {
    const rpc = vi.fn(async (_name: string, _args: unknown) => ({
      data: [{ report_id: "report-1", action: "inserted" }],
      error: null,
    }));
    const provider = new SupabaseProvider(undefined, { rpc } as never);

    const result = await provider.ingestDailyReport(reportDraft);

    expect(result).toEqual({ reportId: "report-1", action: "inserted" });
    expect(rpc).toHaveBeenCalledWith("ingest_daily_report", {
      p_report: expect.objectContaining({
        report_date: reportDraft.reportDate,
        total_selected: 1,
      }),
      p_items: [
        expect.objectContaining({
          opportunity_id: reportDraft.items[0].opportunityId,
          source_url: card.sourceUrl,
        }),
      ],
    });
    const payload = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(JSON.stringify(payload)).not.toContain("jenny_comment");
    expect(JSON.stringify(payload)).not.toContain("jenny_recommended");
  });

  it("sends only machine fields to the protected ingest RPC", async () => {
    const rpc = vi.fn(async (
      _name: string,
      _args: { p_payload: Record<string, unknown> },
    ) => ({
      data: [{
        record_id: "row-1",
        action: "updated",
        needs_jenny_comment: false,
      }],
      error: null,
    }));
    const provider = new SupabaseProvider(undefined, { rpc } as never);

    const result = await provider.ingestOpportunity(card);
    const [, args] = rpc.mock.calls[0];
    const payload = args.p_payload;

    expect(result).toEqual({
      recordId: "row-1",
      action: "updated",
      needsJennyComment: false,
    });
    expect(payload.ai_comment_suggestion).toBe(card.jennyComment);
    expect(payload.raw_payload).toEqual({
      scoreBreakdown: card.scoreBreakdown,
      riskReason: card.riskReason,
    });
    for (const field of [
      "status",
      "is_public",
      "jenny_comment",
      "jenny_comment_status",
      "jenny_comment_updated_at",
      "review_note",
      "published_at",
    ]) {
      expect(payload).not.toHaveProperty(field);
    }
  });

  it("applies every public-review filter and keyword filter", async () => {
    const operations: Array<[string, ...unknown[]]> = [];
    const builder = {
      select: (...args: unknown[]) => {
        operations.push(["select", ...args]);
        return builder;
      },
      eq: (...args: unknown[]) => {
        operations.push(["eq", ...args]);
        return builder;
      },
      not: (...args: unknown[]) => {
        operations.push(["not", ...args]);
        return builder;
      },
      neq: (...args: unknown[]) => {
        operations.push(["neq", ...args]);
        return builder;
      },
      contains: (...args: unknown[]) => {
        operations.push(["contains", ...args]);
        return builder;
      },
      or: (...args: unknown[]) => {
        operations.push(["or", ...args]);
        return builder;
      },
      order: (...args: unknown[]) => {
        operations.push(["order", ...args]);
        return builder;
      },
      range: async (...args: unknown[]) => {
        operations.push(["range", ...args]);
        return { data: [], error: null, count: 0 };
      },
      maybeSingle: async () => ({ data: null, error: null }),
    };
    const provider = new SupabaseProvider({
      from: (table: string) => {
        expect(table).toBe("opportunities");
        return builder;
      },
    } as never);

    await provider.listPublicOpportunities({
      page: 1,
      pageSize: 20,
      tag: "远程",
      type: "工作机会",
      risk: "低",
      keyword: "顾问",
    });

    expect(operations).toContainEqual(["eq", "status", "published"]);
    expect(operations).toContainEqual(["eq", "is_public", true]);
    expect(operations).toContainEqual([
      "eq",
      "jenny_comment_status",
      "approved",
    ]);
    expect(operations).toContainEqual(["not", "jenny_comment", "is", null]);
    expect(operations).toContainEqual(["neq", "jenny_comment", ""]);
    expect(operations).toContainEqual(["contains", "tags", ["远程"]]);
    expect(operations.some(([name]) => name === "or")).toBe(true);
  });
});
