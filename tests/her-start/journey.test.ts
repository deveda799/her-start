import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/analyze/route";
import { _resetRateLimitForTests } from "@/lib/her-start/rate-limit";
import { saveProgress, loadProgress, clearProgress } from "@/lib/her-start/use-progress";
import { demoAnalysis } from "@/lib/her-start/demo";

// Mock localStorage + window for Node.js test env
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
};

vi.stubGlobal("window", { localStorage: localStorageMock });
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 10) });

beforeEach(() => {
  localStorageMock.clear();
  _resetRateLimitForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorageMock.clear();
  _resetRateLimitForTests();
});

// 真实业务级 fixture：每个回答足够详细，符合真实用户输入
const VALID_ANSWERS = [
  "我有十年互联网医疗运营经验，做过医生资源拓展、项目运营和团队培训。擅长把复杂经验整理成可复用的SOP，也经历过一次从大厂到创业的职业转型。",
  "同事经常找我梳理副业方向和AI实践方法。上个月有位做知识付费的朋友找我，她不知道怎么把自己积累的育儿经验做成产品，我帮她拆解了从内容到交付的全流程。",
  "我愿意长期研究女性职业转型和经验产品化，因为我自己经历过从职场到家庭的转变，深知很多女性有能力但不知道怎么变现。这件事即使暂时没有收入我也愿意持续投入。",
  "每周可投入6-8小时，希望线上为主、不愿意出镜、从一对一轻量服务开始。第一阶段希望验证500-1000元的付费意愿，同时兼顾家庭。",
];

// 真实级动态追问回答（有具体案例细节）
const REAL_FOLLOWUP_ANSWER = "上个月同事小张找我帮她拆解一个知识付费项目，她有三年的母婴内容积累但不知道怎么定价和设计交付流程，我帮她从用户需求倒推产品设计，最终她以699元的价格完成了首次售卖。";

const REAL_FOLLOWUP_QUESTION = "你提到经常帮别人梳理副业方向，最近一次是谁找你？她具体卡在哪里？";

describe("Her Start end-to-end user journey", () => {
  it("A: four questions -> needs_followup -> followup answer -> complete result", async () => {
    saveProgress({ answers: VALID_ANSWERS, step: 3 });
    const state = loadProgress();
    expect(state.answers).toEqual(VALID_ANSWERS);

    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const req1 = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: VALID_ANSWERS, requestId: "req-journey-0001" }),
      headers: { "Content-Type": "application/json" },
    });
    const res1 = await POST(req1);
    const body1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(body1.status).toBe("needs_followup");
    expect(body1.followup.question).toBeTruthy();
    expect(body1.followup.question.length).toBeLessThanOrEqual(80);
    expect(body1.followup.missingReason).toBeTruthy();
    expect(body1.demo).toBe(true);

    saveProgress({ followupQuestion: body1.followup.question });
    saveProgress({ followupAnswer: REAL_FOLLOWUP_ANSWER });

    const req2 = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        answers: VALID_ANSWERS,
        followup: { question: body1.followup.question, answer: REAL_FOLLOWUP_ANSWER },
        followupUsed: true,
        requestId: "req-journey-0002",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res2 = await POST(req2);
    const body2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(body2.status).toBe("complete");
    expect(body2.demo).toBe(true);
    expect(body2.result.lifeAssetCard.assets).toHaveLength(3);
    expect(body2.result.lifeAssetCard.valuePositioning).toBeTruthy();
    expect(body2.result.minimumProductCard.productName).toBeTruthy();
    expect(body2.result.minimumProductCard.testPrice).toBeTruthy();
    expect(body2.result.actionCard.actions.some((a: { realUserContact: boolean }) => a.realUserContact)).toBe(true);
    expect(body2.result.closing).toContain("你不是缺少价值");

    saveProgress({
      result: body2.result,
      isDemo: true,
      points: 100,
      createdAt: new Date().toISOString(),
    });
    const finalState = loadProgress();
    expect(finalState.result).toBeTruthy();
    expect(finalState.points).toBe(100);
    expect(finalState.isDemo).toBe(true);
  });

  it("B: four questions with followupUsed=true returns complete directly", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        answers: VALID_ANSWERS,
        followup: { question: REAL_FOLLOWUP_QUESTION, answer: REAL_FOLLOWUP_ANSWER },
        followupUsed: true,
        requestId: "req-journey-0003",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.status).toBe("complete");
    expect(body.result.lifeAssetCard.assets).toHaveLength(3);
  });

  it("validates: empty answers return 400 error", async () => {
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: ["", "测试", "测试", "测试"], requestId: "req-journey-0004" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("validates: answers exceeding 500 chars return 400", async () => {
    const longAnswer = "a".repeat(501);
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: [longAnswer, "b", "c", "d"], requestId: "req-journey-0005" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("validates: requestId too short returns 400", async () => {
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: VALID_ANSWERS, requestId: "short" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("localStorage: saves and restores answers across page reloads", () => {
    saveProgress({ answers: VALID_ANSWERS, step: 2 });
    const restored = loadProgress();
    expect(restored.answers).toEqual(VALID_ANSWERS);
    expect(restored.step).toBe(2);
  });

  it("localStorage: handles old/corrupt data gracefully", () => {
    store["her-start-v2"] = JSON.stringify({ oldField: true, answers: ["only one"] });
    const restored = loadProgress();
    expect(restored.answers).toEqual(["", "", "", ""]);
  });

  it("localStorage: demo result can be saved and retrieved", () => {
    saveProgress({
      result: demoAnalysis,
      isDemo: true,
      points: 100,
      createdAt: "2026-07-18T10:00:00.000Z",
    });
    const restored = loadProgress();
    expect(restored.result).toEqual(demoAnalysis);
    expect(restored.isDemo).toBe(true);
    expect(restored.points).toBe(100);
  });

  it("prevents double submission: followupUsed=true never returns needs_followup", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        answers: VALID_ANSWERS,
        followup: { question: REAL_FOLLOWUP_QUESTION, answer: REAL_FOLLOWUP_ANSWER },
        followupUsed: true,
        requestId: "req-journey-0006",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.status).toBe("complete");
    expect(body.status).not.toBe("needs_followup");
  });

  it("clearProgress resets localStorage state", () => {
    saveProgress({ answers: VALID_ANSWERS, step: 3, points: 100 });
    clearProgress();
    const restored = loadProgress();
    expect(restored.answers).toEqual(["", "", "", ""]);
    expect(restored.points).toBe(0);
  });

  it("rate limit: hitting IP hourly limit returns demo complete", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");
    vi.stubEnv("IP_HOURLY_AI_LIMIT", "1");

    // First call: succeeds (returns needs_followup in demo mode)
    const req1 = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: VALID_ANSWERS, requestId: "req-journey-0007" }),
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    });
    const res1 = await POST(req1);
    const body1 = await res1.json();
    expect(res1.status).toBe(200);

    // Second call from same IP: should hit limit, return demo complete
    const req2 = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: VALID_ANSWERS, requestId: "req-journey-0008" }),
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    });
    const res2 = await POST(req2);
    const body2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(body2.status).toBe("complete");
    expect(body2.demo).toBe(true);
    expect(body2.message).toBeTruthy();
  });
});
