import { describe, expect, it } from "vitest";
import { parseCaseCard } from "@/lib/ai/case-card-schema";
import type { RawItem } from "@/lib/types";

const rawItem: RawItem = {
  title: "原始标题",
  url: "https://example.com/opportunity",
  summary: "公开内容摘要",
  source: "公开来源",
  publishedAt: "2026-06-28T00:00:00.000Z",
  sourceId: "manual",
  sourceType: "manual",
};

describe("parseCaseCard", () => {
  it("clamps score components and recomputes the total", () => {
    const parsed = parseCaseCard({
      title: "35+女性远程顾问机会",
      opportunityType: "工作机会",
      audiences: ["35+女性", "职场转型者"],
      timeRequirement: "每周约10小时",
      skillThreshold: "项目管理经验",
      riskLevel: "低",
      aiAssistance: "AI可辅助整理方案和会议纪要",
      summary: "从小项目开始验证顾问服务。",
      jennyComment: "投入可控，适合从已有经验切入。",
      actionSuggestion: "今天列出三个可提供的顾问服务。",
      tags: ["远程", "顾问"],
      scoreBreakdown: {
        audienceFit: 99,
        painStrength: 20,
        actionability: 20,
        timeliness: 10,
        riskControl: 8,
      },
      riskReason: "需要核实合作方和付款条款。",
    }, rawItem, () => new Date("2026-06-29T01:00:00.000Z"));

    expect(parsed.scoreBreakdown.audienceFit).toBe(25);
    expect(parsed.score).toBe(83);
    expect(parsed.sourceUrl).toBe(rawItem.url);
    expect(parsed.source).toBe(rawItem.source);
    expect(parsed.status).toBe("待审核");
  });
});
