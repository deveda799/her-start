import { describe, expect, it, vi } from "vitest";
import { runCollect } from "@/lib/collect/pipeline";
import type {
  CaseCard,
  RawItem,
  SourceCollectionResult,
} from "@/lib/types";
import type { SourceConfig } from "@/lib/config/sources";

const sources: SourceConfig[] = [
  {
    id: "ok",
    name: "成功来源",
    type: "manual",
    enabled: true,
    items: [{ title: "x", url: "https://example.com/a", summary: "测试摘要" }],
  },
  {
    id: "failed",
    name: "失败来源",
    type: "web",
    enabled: true,
    url: "https://example.com/fail",
  },
];

const raw: RawItem = {
  title: "远程项目顾问机会",
  url: "https://example.com/a",
  summary: "适合有项目经验的转型者，每周投入十小时。",
  source: "成功来源",
  publishedAt: "2026-06-28T00:00:00.000Z",
  sourceId: "ok",
  sourceType: "manual",
};

const secondRaw: RawItem = {
  ...raw,
  title: "AI 简历提效案例",
  url: "https://example.com/b",
};

function cardFor(item: RawItem): CaseCard {
  return {
    title: item.title,
    source: item.source,
    sourceUrl: item.url,
    publishedDate: item.publishedAt,
    opportunityType: "工作机会",
    audiences: ["职场转型者"],
    timeRequirement: "每周10小时",
    skillThreshold: "项目经验",
    riskLevel: "低",
    aiAssistance: "整理方案",
    summary: item.summary,
    jennyComment: "投入可控",
    actionSuggestion: "列出三个服务",
    tags: ["远程"],
    scoreBreakdown: {
      audienceFit: 25,
      painStrength: 20,
      actionability: 20,
      timeliness: 10,
      riskControl: 8,
    },
    score: 83,
    riskReason: "核实付款",
    status: "待审核",
    createdAt: "2026-06-29T01:00:00.000Z",
  };
}

describe("runCollect", () => {
  it("continues after a source failure and never writes data in dry-run", async () => {
    const collectSource = vi.fn(async (source: SourceConfig): Promise<SourceCollectionResult> => {
      if (source.id === "failed") throw new Error("source unavailable");
      return { items: [raw], errors: [], skipped: [] };
    });
    const ingestOpportunity = vi.fn(() => {
      throw new Error("must not write data");
    });
    const ingestDailyReport = vi.fn(() => {
      throw new Error("must not write report");
    });

    const result = await runCollect({
      dryRun: true,
      sources,
      maxItemsPerRun: 50,
      now: () => new Date("2026-06-29T01:00:00.000Z"),
    }, {
      collectSource,
      aiClient: { generateCaseCard: async (item) => cardFor(item) },
      ingestProvider: { ingestOpportunity, ingestDailyReport },
      logger: { log: vi.fn(), error: vi.fn() },
    });

    expect(result.report.totalCollected).toBe(1);
    expect(result.report.totalPassed).toBe(1);
    expect(result.report.totalWrittenToSupabase).toBe(0);
    expect(result.report.errors[0].message).toBe("source unavailable");
    expect(result.report.recommendedTop3).toHaveLength(1);
    expect(ingestOpportunity).not.toHaveBeenCalled();
    expect(ingestDailyReport).not.toHaveBeenCalled();
  });

  it("reports inserted and duplicate URL outcomes", async () => {
    const ingestOpportunity = vi.fn()
      .mockResolvedValueOnce({
        recordId: "new",
        action: "inserted" as const,
        needsJennyComment: true,
      })
      .mockResolvedValueOnce({
        recordId: "existing",
        action: "updated" as const,
        needsJennyComment: false,
      });
    const ingestDailyReport = vi.fn(async () => ({
      reportId: "report-1",
      action: "inserted" as const,
    }));

    const result = await runCollect({
      dryRun: false,
      sources: [sources[0]],
      maxItemsPerRun: 50,
      now: () => new Date("2026-06-29T01:00:00.000Z"),
    }, {
      collectSource: async () => ({
        items: [raw, secondRaw],
        errors: [],
        skipped: [],
      }),
      aiClient: { generateCaseCard: async (item) => cardFor(item) },
      ingestProvider: { ingestOpportunity, ingestDailyReport },
      logger: { log: vi.fn(), error: vi.fn() },
    });

    expect(result.report.totalWrittenToSupabase).toBe(2);
    expect(result.report.totalInserted).toBe(1);
    expect(result.report.duplicateUrls).toBe(1);
    expect(result.report.machineFieldsUpdated).toBe(1);
    expect(result.report.manualFieldsPreserved).toBe(1);
    expect(result.report.pendingJennyComments).toBe(1);
    expect(ingestDailyReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportDate: result.report.reportDate,
        totalCollected: 2,
        items: expect.arrayContaining([
          expect.objectContaining({ opportunityId: "new" }),
          expect.objectContaining({ opportunityId: "existing" }),
        ]),
      }),
    );
  });

  it("records one provider failure and continues with other cards", async () => {
    const ingestOpportunity = vi.fn()
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce({
        recordId: "new",
        action: "inserted" as const,
        needsJennyComment: true,
      });
    const ingestDailyReport = vi.fn(async () => ({
      reportId: "report-1",
      action: "inserted" as const,
    }));

    const result = await runCollect({
      dryRun: false,
      sources: [sources[0]],
      maxItemsPerRun: 50,
    }, {
      collectSource: async () => ({
        items: [raw, secondRaw],
        errors: [],
        skipped: [],
      }),
      aiClient: { generateCaseCard: async (item) => cardFor(item) },
      ingestProvider: { ingestOpportunity, ingestDailyReport },
      logger: { log: vi.fn(), error: vi.fn() },
    });

    expect(result.report.totalWrittenToSupabase).toBe(1);
    expect(result.report.errors).toContainEqual({
      scope: "data-write",
      sourceId: "ok",
      message: "database unavailable",
    });
    expect(ingestDailyReport).toHaveBeenCalledOnce();
  });
});
