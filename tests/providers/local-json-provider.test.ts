import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalJsonProvider } from "@/lib/providers/local-json-provider";
import type { OpportunityRecord } from "@/lib/providers/contracts";
import type { CaseCard } from "@/lib/types";

const approved: OpportunityRecord = {
  id: "approved",
  sourceUrl: "https://example.com/opportunity",
  title: "远程项目顾问",
  opportunityType: "工作机会",
  audiences: ["职场转型者"],
  timeRequirement: "每周10小时",
  skillThreshold: "项目经验",
  riskLevel: "低",
  aiAssistance: "整理方案",
  summary: "公开摘要",
  jennyComment: "人工确认点评",
  actionSuggestion: "列出三个服务",
  publishedDate: "2026-06-29",
  source: "公开来源",
  tags: ["远程"],
  score: 83,
  status: "published",
  isPublic: true,
  jennyCommentStatus: "approved",
  jennyCommentUpdatedAt: "2026-06-30T01:00:00.000Z",
  reviewNote: "人工已核实",
  publishedAt: "2026-06-30T01:00:00.000Z",
  aiCommentSuggestion: "旧 AI 建议",
  rawPayload: {},
  lastSyncedAt: "2026-06-30T00:00:00.000Z",
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T01:00:00.000Z",
};

const card: CaseCard = {
  title: "更新后的机器标题",
  source: "更新来源",
  sourceUrl: approved.sourceUrl,
  publishedDate: "2026-06-30",
  opportunityType: "工作机会",
  audiences: ["35+女性"],
  timeRequirement: "每周8小时",
  skillThreshold: "沟通经验",
  riskLevel: "中",
  aiAssistance: "生成提纲",
  summary: "更新摘要",
  jennyComment: "新的 AI 建议",
  actionSuggestion: "今天联系一位客户",
  tags: ["顾问"],
  scoreBreakdown: {
    audienceFit: 25,
    painStrength: 20,
    actionability: 20,
    timeliness: 10,
    riskControl: 5,
  },
  score: 80,
  riskReason: "需要核实客户",
  status: "待审核",
  createdAt: "2026-06-30T02:00:00.000Z",
};

describe("LocalJsonProvider", () => {
  it("returns the latest public daily report and hides pending reports", async () => {
    const provider = new LocalJsonProvider([], undefined, () => new Date(), [
      {
        id: "published-report",
        reportDate: "2026-07-01",
        title: "已发布日报",
        subtitle: "副标题",
        summary: "摘要",
        totalCollected: 2,
        totalSelected: 1,
        totalRecommended: 1,
        totalHighRisk: 0,
        totalLowBarrier: 1,
        totalAiAssisted: 1,
        trendAnalysis: {
          opportunityTypes: {},
          audiences: {},
          riskLevels: {},
          observations: [],
          focusDirections: [],
          riskWarnings: [],
        },
        actionSuggestions: {
          jobSeeker: "",
          fullTimeMom: "",
          sideHustle: "",
          aiEfficiency: "",
        },
        jennyDailyComment: null,
        publishedAt: "2026-07-01T01:00:00.000Z",
        items: [],
        status: "published",
        isPublic: true,
        rawPayload: {},
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T01:00:00.000Z",
      },
      {
        id: "pending-report",
        reportDate: "2026-07-02",
        title: "待审核日报",
        subtitle: "副标题",
        summary: "摘要",
        totalCollected: 2,
        totalSelected: 1,
        totalRecommended: 1,
        totalHighRisk: 0,
        totalLowBarrier: 1,
        totalAiAssisted: 1,
        trendAnalysis: {
          opportunityTypes: {},
          audiences: {},
          riskLevels: {},
          observations: [],
          focusDirections: [],
          riskWarnings: [],
        },
        actionSuggestions: {
          jobSeeker: "",
          fullTimeMom: "",
          sideHustle: "",
          aiEfficiency: "",
        },
        jennyDailyComment: null,
        publishedAt: null,
        items: [],
        status: "pending",
        isPublic: false,
        rawPayload: {},
        createdAt: "2026-07-02T00:00:00.000Z",
        updatedAt: "2026-07-02T00:00:00.000Z",
      },
    ]);

    const report = await provider.getLatestPublicDailyReport("2026-07-02");

    expect(report?.id).toBe("published-report");
  });

  it("returns only fully reviewed public rows and supports keyword filtering", async () => {
    const provider = new LocalJsonProvider([
      approved,
      { ...approved, id: "pending", status: "pending" },
      { ...approved, id: "blank", jennyComment: " " },
    ]);

    const result = await provider.listPublicOpportunities({
      page: 1,
      pageSize: 20,
      keyword: "顾问",
    });

    expect(result.items.map((item) => item.id)).toEqual(["approved"]);
  });

  it("preserves every manual field when updating a duplicate URL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "jenny-provider-"));
    const path = join(directory, "opportunities.json");
    await writeFile(path, JSON.stringify([approved]), "utf8");
    const provider = await LocalJsonProvider.fromFile(path);

    const result = await provider.ingestOpportunity(card);
    const [stored] = JSON.parse(await readFile(path, "utf8")) as OpportunityRecord[];

    expect(result.action).toBe("updated");
    expect(stored.title).toBe(card.title);
    expect(stored.aiCommentSuggestion).toBe(card.jennyComment);
    expect(stored.status).toBe(approved.status);
    expect(stored.isPublic).toBe(approved.isPublic);
    expect(stored.jennyComment).toBe(approved.jennyComment);
    expect(stored.jennyCommentStatus).toBe(approved.jennyCommentStatus);
    expect(stored.jennyCommentUpdatedAt).toBe(approved.jennyCommentUpdatedAt);
    expect(stored.reviewNote).toBe(approved.reviewNote);
    expect(stored.publishedAt).toBe(approved.publishedAt);
  });
});
