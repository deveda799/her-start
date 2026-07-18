import { describe, expect, it, vi } from "vitest";
import { handleDetailRequest } from "@/lib/api/opportunities-route-handlers";
import type { OpportunityDataProvider } from "@/lib/providers/contracts";
import type { PublicOpportunity } from "@/lib/types";

const opportunity: PublicOpportunity = {
  id: "row-1",
  title: "远程顾问",
  sourceUrl: "https://example.com/opportunity",
  opportunityType: "工作机会",
  audiences: ["职场转型者"],
  timeRequirement: "每周10小时",
  skillThreshold: "项目经验",
  riskLevel: "低",
  aiAssistance: "整理方案",
  summary: "公开摘要",
  jennyComment: "人工点评",
  actionSuggestion: "列出三个服务",
  publishedDate: "2026-06-29",
  source: "公开来源",
  tags: ["远程"],
  score: 83,
  publishedAt: "2026-06-30T00:00:00.000Z",
};

describe("opportunity detail API", () => {
  it("returns a public opportunity", async () => {
    const provider = {
      listPublicOpportunities: vi.fn(),
      getPublicOpportunity: vi.fn(async () => opportunity),
      getLatestPublicDailyReport: vi.fn(),
      getPublicDailyReportByDate: vi.fn(),
    } satisfies OpportunityDataProvider;

    const response = await handleDetailRequest("row-1", provider);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(opportunity);
  });

  it("returns 404 for missing or unreviewed opportunities", async () => {
    const provider = {
      listPublicOpportunities: vi.fn(),
      getPublicOpportunity: vi.fn(async () => null),
      getLatestPublicDailyReport: vi.fn(),
      getPublicDailyReportByDate: vi.fn(),
    } satisfies OpportunityDataProvider;

    const response = await handleDetailRequest("missing", provider);

    expect(response.status).toBe(404);
  });
});
