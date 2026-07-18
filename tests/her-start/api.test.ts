import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Her Start analyze API", () => {
  it("returns demo followup on first request when AI is not configured", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        requestId: "request-123",
        answers: [
          "我有十年运营经验，做过医疗项目和团队协作。",
          "朋友经常找我梳理副业方向和AI工具使用。",
          "我愿意长期研究女性职业转型和经验产品化。",
          "每周可以投入六小时，希望线上、低成本、不依赖出镜。",
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("needs_followup");
    expect(body.followup.question).toBeTruthy();
    expect(body.followup.question.length).toBeLessThanOrEqual(80);
    expect(body.demo).toBe(true);
  });

  it("returns complete demo result when followupUsed=true", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        requestId: "request-456",
        answers: [
          "我有十年运营经验。",
          "朋友经常找我梳理副业方向。",
          "我愿意长期研究女性职业转型。",
          "每周可投入六小时，希望线上。",
        ],
        followup: {
          question: "最近一次是谁找你？她卡在哪里？",
          answer: "上个月同事小张找我帮她拆解知识付费项目，她不知道怎么把课程卖出去。",
        },
        followupUsed: true,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("complete");
    expect(body.demo).toBe(true);
    expect(body.result.lifeAssetCard.assets).toHaveLength(3);
    expect(body.result.minimumProductCard.productName).toBeTruthy();
    expect(body.result.actionCard.actions.some((a: { realUserContact: boolean }) => a.realUserContact)).toBe(true);
  });
});
