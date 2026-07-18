import { describe, expect, it } from "vitest";
import { buildDailyReportDraft } from "@/lib/report/daily-report-draft";
import type { CaseCard } from "@/lib/types";

function card(
  title: string,
  score: number,
  overrides: Partial<CaseCard> = {},
): CaseCard {
  return {
    title,
    source: "公开来源",
    sourceUrl: `https://example.com/${score}`,
    publishedDate: "2026-07-02",
    opportunityType: "工作机会",
    audiences: ["35+女性", "宝妈"],
    timeRequirement: "每天2小时",
    skillThreshold: "低门槛",
    riskLevel: "低",
    aiAssistance: "用AI整理简历",
    summary: "适合灵活安排时间的机会。",
    jennyComment: "建议先小范围验证。",
    actionSuggestion: "今天完成一份针对性简历。",
    tags: ["灵活就业"],
    scoreBreakdown: {
      audienceFit: 25,
      painStrength: 20,
      actionability: 20,
      timeliness: 10,
      riskControl: 10,
    },
    score,
    riskReason: "风险可控",
    status: "待审核",
    createdAt: "2026-07-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildDailyReportDraft", () => {
  it("builds ranked snapshots, distributions and audience actions", () => {
    const cards = [
      card("第二名", 80),
      card("第一名", 92, {
        opportunityType: "副业案例",
        riskLevel: "高",
        skillThreshold: "需要专业经验",
      }),
    ];

    const report = buildDailyReportDraft({
      cards,
      recordIds: new Map(cards.map((item, index) => [
        item.sourceUrl,
        `opportunity-${index + 1}`,
      ])),
      reportDate: "2026-07-02",
      totalCollected: 8,
    });

    expect(report.items.map((item) => item.title))
      .toEqual(["第一名", "第二名"]);
    expect(report.items[0].rank).toBe(1);
    expect(report.totalCollected).toBe(8);
    expect(report.totalSelected).toBe(2);
    expect(report.totalHighRisk).toBe(1);
    expect(report.totalLowBarrier).toBe(1);
    expect(report.totalAiAssisted).toBe(2);
    expect(report.trendAnalysis.opportunityTypes).toEqual({
      副业案例: 1,
      工作机会: 1,
    });
    expect(report.actionSuggestions.fullTimeMom).toContain("宝妈");
  });
});
