import { describe, expect, it } from "vitest";
import {
  FeishuClient,
  extractOriginalUrl,
} from "@/lib/feishu/client";
import { caseCardToFeishuFields } from "@/lib/feishu/fields";
import type { CaseCard } from "@/lib/types";

const card: CaseCard = {
  title: "远程顾问",
  source: "公开来源",
  sourceUrl: "https://example.com/job",
  publishedDate: "2026-06-28T00:00:00.000Z",
  opportunityType: "工作机会",
  audiences: ["35+女性"],
  timeRequirement: "每周10小时",
  skillThreshold: "项目管理",
  riskLevel: "低",
  aiAssistance: "整理交付物",
  summary: "从小项目开始。",
  jennyComment: "投入可控。",
  actionSuggestion: "列出三个服务。",
  tags: ["远程"],
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
  createdAt: "2026-06-29T01:00:00.000Z",
};

describe("FeishuClient", () => {
  it("reads all record pages", async () => {
    const requested: string[] = [];
    const fakeFetch: typeof fetch = async (input) => {
      const url = String(input);
      requested.push(url);
      if (url.includes("/auth/v3/tenant_access_token/internal")) {
        return Response.json({ code: 0, tenant_access_token: "tenant-test", expire: 7200 });
      }
      if (url.includes("page_token=next")) {
        return Response.json({
          code: 0,
          data: { items: [{ record_id: "rec-2", fields: {} }], has_more: false },
        });
      }
      return Response.json({
        code: 0,
        data: {
          items: [{ record_id: "rec-1", fields: {} }],
          has_more: true,
          page_token: "next",
        },
      });
    };
    const client = new FeishuClient({
      appId: "app",
      appSecret: "secret",
      appToken: "base",
      tableId: "table",
    }, fakeFetch);

    const records = await client.listAllRecords();

    expect(records.map((record) => record.record_id)).toEqual(["rec-1", "rec-2"]);
    expect(requested.some((url) => url.includes("page_token=next"))).toBe(true);
  });

  it("extracts URL fields in supported Feishu shapes", () => {
    expect(extractOriginalUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(extractOriginalUrl({ link: "https://example.com/b", text: "原文" }))
      .toBe("https://example.com/b");
  });

  it("maps a case card to the required Chinese fields", () => {
    const fields = caseCardToFeishuFields(card);

    expect(fields["原文链接"]).toEqual({
      link: "https://example.com/job",
      text: "https://example.com/job",
    });
    expect(fields["状态"]).toBe("待审核");
    expect(fields["评分"]).toBe(83);
  });
});
