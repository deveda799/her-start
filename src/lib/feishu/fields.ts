import type { CaseCard } from "@/lib/types";

export function caseCardToFeishuFields(card: CaseCard): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    "标题": card.title,
    "来源": card.source,
    "原文链接": { link: card.sourceUrl, text: card.sourceUrl },
    "机会类型": card.opportunityType,
    "适合人群": card.audiences,
    "时间要求": card.timeRequirement,
    "技能门槛": card.skillThreshold,
    "风险等级": card.riskLevel,
    "AI可辅助点": card.aiAssistance,
    "案例摘要": card.summary,
    "珍妮点评": card.jennyComment,
    "今日行动建议": card.actionSuggestion,
    "标签": card.tags,
    "评分": card.score,
    "状态": "待审核",
    "创建时间": Date.parse(card.createdAt),
  };
  if (card.publishedDate) {
    fields["发布日期"] = Date.parse(card.publishedDate);
  }
  return fields;
}
