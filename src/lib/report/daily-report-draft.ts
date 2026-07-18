import type {
  CaseCard,
  DailyReportDraft,
  ReportTrendAnalysis,
} from "@/lib/types";

function count(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function topKey(distribution: Record<string, number>): string | null {
  return Object.entries(distribution)
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function trends(cards: CaseCard[]): ReportTrendAnalysis {
  const opportunityTypes = count(cards.map((card) => card.opportunityType));
  const audiences = count(cards.flatMap((card) => card.audiences));
  const riskLevels = count(cards.map((card) => card.riskLevel));
  const mainType = topKey(opportunityTypes);
  const mainAudience = topKey(audiences);
  const highRisk = riskLevels["高"] ?? 0;
  return {
    opportunityTypes,
    audiences,
    riskLevels,
    observations: cards.length === 0
      ? ["今日暂无入选机会，建议保持关注。"]
      : [
          `今日机会以${mainType ?? "多元方向"}为主。`,
          `${mainAudience ?? "职场转型人群"}相关内容较集中。`,
        ],
    focusDirections: mainType
      ? [`优先关注${mainType}中评分高、行动路径清晰的机会。`]
      : [],
    riskWarnings: highRisk > 0
      ? [`发现${highRisk}条高风险内容，请重点核实收费、收益和合作主体。`]
      : ["今日入选内容未发现高风险集中趋势，仍需自行核实原文。"],
  };
}

export function buildDailyReportDraft(input: {
  cards: CaseCard[];
  recordIds: Map<string, string>;
  reportDate: string;
  totalCollected: number;
}): DailyReportDraft {
  const sorted = [...input.cards].sort((left, right) => right.score - left.score);
  const top10 = sorted.slice(0, 10);
  const reportTrends = trends(top10);
  return {
    reportDate: input.reportDate,
    title: "珍妮35+女性职业机会日报",
    subtitle: "每日筛选适合35+女性、宝妈和职场转型者的工作、副业与AI提效机会",
    summary: `今日采集${input.totalCollected}条，入选${sorted.length}条，精选Top${top10.length}供你快速判断。`,
    totalCollected: input.totalCollected,
    totalSelected: sorted.length,
    totalRecommended: sorted.filter((card) => card.riskLevel !== "高")
      .slice(0, 3).length,
    totalHighRisk: sorted.filter((card) => card.riskLevel === "高").length,
    totalLowBarrier: sorted.filter((card) =>
      /低|零基础|无经验/.test(card.skillThreshold)).length,
    totalAiAssisted: sorted.filter((card) => card.aiAssistance.trim()).length,
    trendAnalysis: reportTrends,
    actionSuggestions: {
      jobSeeker: "如果你想找工作：选一条匹配度最高的机会，今天完成一版针对性简历并核实投递渠道。",
      fullTimeMom: "如果你是全职宝妈：优先查看时间灵活、低门槛、可分段完成的机会，先安排30分钟验证。",
      sideHustle: "如果你想做副业：不要先交费，选一个低成本方向访谈3位潜在客户。",
      aiEfficiency: "如果你想用AI提效：今天尝试用AI整理岗位要求、生成行动清单或优化简历表达。",
    },
    items: top10.map((card, index) => ({
      opportunityId: input.recordIds.get(card.sourceUrl) ?? null,
      rank: index + 1,
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
      reasonForSelection: card.jennyComment || card.riskReason,
      actionStep: card.actionSuggestion,
      tags: card.tags,
    })),
    rawPayload: {
      generatedBy: "collect",
      scores: top10.map((card) => ({
        sourceUrl: card.sourceUrl,
        scoreBreakdown: card.scoreBreakdown,
      })),
    },
  };
}
