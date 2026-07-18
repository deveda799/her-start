import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Her Start analyze API", () => {
  it("falls back to marked demo output when AI is not configured", async () => {
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
    expect(body.demo).toBe(true);
    expect(body.result.lifeAssetCard.assets).toHaveLength(3);
    expect(body.result.minimumProductCard.productName).toBeTruthy();
    expect(body.result.actionCard.actions.some((action: { realUserContact: boolean }) => action.realUserContact)).toBe(true);
  });
});
