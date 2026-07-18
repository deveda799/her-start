import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { _resetRateLimitForTests } from "@/lib/her-start/rate-limit";

beforeEach(() => { _resetRateLimitForTests(); });
afterEach(() => { vi.unstubAllEnvs(); _resetRateLimitForTests(); });

const VALID_ANSWERS = [
  "我有十年互联网医疗运营经验，做过医生资源拓展和团队培训。擅长把复杂经验整理成SOP。",
  "同事经常找我梳理副业方向，上个月帮朋友拆解知识付费项目的定价和交付流程。",
  "我愿意长期研究女性职业转型和经验产品化，因为我自己经历过从职场到家庭的转变。",
  "每周可投入六小时，希望线上、不出镜、从轻量一对一开始，验证500元付费意愿。",
];

describe("Her Start analyze API", () => {
  it("returns demo followup on first request when AI is not configured", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        requestId: "api-test-0001",
        answers: VALID_ANSWERS,
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
        requestId: "api-test-0002",
        answers: VALID_ANSWERS,
        followup: {
          question: "你提到经常帮别人梳理副业方向，最近一次是谁找你？她具体卡在哪里？",
          answer: "上个月同事小张找我帮她拆解知识付费项目，她不知道怎么把课程卖出去，我帮她从用户需求倒推产品设计。",
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
