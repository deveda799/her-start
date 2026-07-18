import { z } from "zod";
import type { CaseCard, RawItem, ScoreBreakdown } from "@/lib/types";

export const caseCardSystemPrompt = `
你是职业机会情报编辑。只根据输入的公开标题、摘要、来源和日期生成结构化案例卡。
目标人群是35+女性、宝妈和职场转型者。
不得虚构雇主、收入、岗位条件、行动步骤或发布日期。
识别广告、灰产、刷单、交费就业和夸张收益；不确定时提高风险等级。
评分上限：人群匹配25、痛点强度25、实操价值25、时效热度15、风险可控10。
今日行动建议必须低成本、可在今天完成。
`.trim();

export const aiCaseCardSchema = z.object({
  title: z.string().min(1),
  opportunityType: z.enum(["工作机会", "副业案例", "AI提效", "灵活就业", "避坑"]),
  audiences: z.array(z.string().min(1)).min(1),
  timeRequirement: z.string(),
  skillThreshold: z.string(),
  riskLevel: z.enum(["低", "中", "高"]),
  aiAssistance: z.string(),
  summary: z.string().min(1),
  jennyComment: z.string(),
  actionSuggestion: z.string(),
  tags: z.array(z.string().min(1)),
  scoreBreakdown: z.object({
    audienceFit: z.number(),
    painStrength: z.number(),
    actionability: z.number(),
    timeliness: z.number(),
    riskControl: z.number(),
  }),
  riskReason: z.string(),
});

export type AiCaseCard = z.infer<typeof aiCaseCardSchema>;

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

export function parseCaseCard(
  input: unknown,
  item: RawItem,
  now: () => Date = () => new Date(),
): CaseCard {
  const parsed = aiCaseCardSchema.parse(input);
  const scoreBreakdown: ScoreBreakdown = {
    audienceFit: clamp(parsed.scoreBreakdown.audienceFit, 25),
    painStrength: clamp(parsed.scoreBreakdown.painStrength, 25),
    actionability: clamp(parsed.scoreBreakdown.actionability, 25),
    timeliness: clamp(parsed.scoreBreakdown.timeliness, 15),
    riskControl: clamp(parsed.scoreBreakdown.riskControl, 10),
  };
  const score = Object.values(scoreBreakdown)
    .reduce((total, component) => total + component, 0);

  return {
    ...parsed,
    source: item.source,
    sourceUrl: item.url,
    publishedDate: item.publishedAt,
    scoreBreakdown,
    score,
    status: "待审核",
    createdAt: now().toISOString(),
  };
}
