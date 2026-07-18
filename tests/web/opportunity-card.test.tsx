// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import type { PublicOpportunity } from "@/lib/types";

const opportunity: PublicOpportunity = {
  id: "row-1",
  title: "远程顾问机会",
  sourceUrl: "https://example.com/job",
  opportunityType: "工作机会",
  audiences: ["35+女性", "职场转型者"],
  timeRequirement: "每周10小时",
  skillThreshold: "项目经验",
  riskLevel: "高",
  aiAssistance: "整理方案",
  summary: "从小项目开始验证顾问服务。",
  jennyComment: "投入可控。",
  actionSuggestion: "列出三个服务。",
  publishedDate: "2026-06-28",
  source: "公开来源",
  tags: ["远程"],
  score: 83,
  publishedAt: "2026-06-29T01:00:00.000Z",
};

describe("OpportunityCard", () => {
  it("renders key fields and a textual risk label", () => {
    render(<OpportunityCard opportunity={opportunity} />);

    expect(screen.getByRole("heading", { name: "远程顾问机会" })).toBeInTheDocument();
    expect(screen.getByText("工作机会")).toBeInTheDocument();
    expect(screen.getByText(/适合：35\+女性、职场转型者/)).toBeInTheDocument();
    expect(screen.getByText(/高风险/)).toBeInTheDocument();
    expect(screen.getByText(/评分 83/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看详情" }))
      .toHaveAttribute("href", "/opportunities/row-1");
  });
});
