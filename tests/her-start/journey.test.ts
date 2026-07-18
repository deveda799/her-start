import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/analyze/route";
import { _resetRateLimitForTests } from "@/lib/her-start/rate-limit";
import { saveProgress, loadProgress, resetAllProgress, computeCacheKey } from "@/lib/her-start/use-progress";
import { demoAnalysis } from "@/lib/her-start/demo";

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

const USER_A_ANSWERS = [
  "我有十年互联网医疗运营经验，做过医生资源拓展、项目运营和团队培训。擅长把复杂经验整理成可复用的SOP，也经历过一次从大厂到创业的职业转型。",
  "同事经常找我梳理副业方向和AI实践方法。上个月有位做知识付费的朋友找我，她不知道怎么把自己积累的育儿经验做成产品，我帮她拆解了从内容到交付的全流程。",
  "我愿意长期研究女性职业转型和经验产品化，因为我自己经历过从职场到家庭的转变，深知很多女性有能力但不知道怎么变现。这件事即使暂时没有收入我也愿意持续投入。",
  "每周可投入6-8小时，希望线上为主、不愿意出镜、从一对一轻量服务开始。第一阶段希望验证500-1000元的付费意愿，同时兼顾家庭。",
];

const USER_B_ANSWERS = [
  "我长期为孩子制作低糖烘焙，组织过社区亲子烘焙活动，熟悉食材选择和儿童口味偏好。也在社区带过烘焙工作坊。",
  "邻居经常询问我低糖配方和儿童生日甜点的做法，有妈妈专门来要我的配方和指导。",
  "我愿意分享儿童低糖烘焙和亲子活动方法，看到孩子们吃得健康我就很开心，这比单纯赚钱更有意义。",
  "每周可投入八小时，接受线下小班和数字配方包，希望从社区开始，验证300-500元的付费意愿。",
];

const REAL_FOLLOWUP_ANSWER = "上个月同事小张找我帮她拆解一个知识付费项目，她有三年的母婴内容积累但不知道怎么定价和设计交付流程，我帮她从用户需求倒推产品设计，最终她以699元的价格完成了首次售卖。";
const REAL_FOLLOWUP_QUESTION = "你提到经常帮别人梳理副业方向，最近一次是谁找你？她具体卡在哪里？";

describe("Her Start end-to-end user journey", () => {
  it("A: demo mode returns complete directly (no wrong followup for user A)", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    saveProgress({ answers: USER_A_ANSWERS, step: 3 });
    const state = loadProgress();
    expect(state.answers).toEqual(USER_A_ANSWERS);

    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: USER_A_ANSWERS, requestId: "req-journey-0001" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("complete");
    expect(body.mode).toBe("demo");
    expect(body.personalized).toBe(false);
    expect(body.demoReason).toBe("missing_config");
    expect(body.analysisId).toBeTruthy();
    expect(body.result.lifeAssetCard.assets).toHaveLength(3);
  });

  it("B: demo mode returns complete directly (no wrong followup for user B)", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");

    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: USER_B_ANSWERS, requestId: "req-journey-0002" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.status).toBe("complete");
    expect(body.mode).toBe("demo");
    expect(body.personalized).toBe(false);
    // 用户 B 没有提到"梳理副业方向"，不应收到相关追问
    expect(body.followup).toBeUndefined();
  });

  it("different answers produce different cache keys", () => {
    const keyA = computeCacheKey(USER_A_ANSWERS);
    const keyB = computeCacheKey(USER_B_ANSWERS);
    expect(keyA).not.toBe(keyB);
  });

  it("followup answer participates in cache key", () => {
    const keyNoFollowup = computeCacheKey(USER_A_ANSWERS);
    const keyWithFollowup = computeCacheKey(USER_A_ANSWERS, REAL_FOLLOWUP_QUESTION, REAL_FOLLOWUP_ANSWER);
    expect(keyNoFollowup).not.toBe(keyWithFollowup);
  });

  it("same answers produce same cache key (cache hit)", () => {
    const key1 = computeCacheKey(USER_A_ANSWERS);
    const key2 = computeCacheKey(USER_A_ANSWERS);
    expect(key1).toBe(key2);
  });

  it("validates: empty answers return 400", async () => {
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: ["", "测试", "测试", "测试"], requestId: "req-journey-0004" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("validates: requestId too short returns 400", async () => {
    const req = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: USER_A_ANSWERS, requestId: "short" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("localStorage: saves and restores answers", () => {
    saveProgress({ answers: USER_A_ANSWERS, step: 2, displayName: "玉琴" });
    const restored = loadProgress();
    expect(restored.answers).toEqual(USER_A_ANSWERS);
    expect(restored.displayName).toBe("玉琴");
  });

  it("localStorage: handles corrupt data gracefully", () => {
    store["her-start-v2"] = JSON.stringify({ oldField: true, answers: ["only one"] });
    const restored = loadProgress();
    expect(restored.answers).toEqual(["", "", "", ""]);
  });

  it("localStorage: demo result saved with mode and analysisId", () => {
    saveProgress({
      result: demoAnalysis,
      isDemo: true,
      mode: "demo",
      personalized: false,
      analysisId: "test-123",
      points: 100,
      createdAt: new Date().toISOString(),
    });
    const restored = loadProgress();
    expect(restored.result).toEqual(demoAnalysis);
    expect(restored.mode).toBe("demo");
    expect(restored.personalized).toBe(false);
    expect(restored.analysisId).toBe("test-123");
  });

  it("resetAllProgress resets state", () => {
    saveProgress({ answers: USER_A_ANSWERS, step: 3, points: 100 });
    resetAllProgress();
    const restored = loadProgress();
    expect(restored.answers).toEqual(["", "", "", ""]);
    expect(restored.points).toBe(0);
  });

  it("rate limit: hitting IP hourly limit returns demo complete", async () => {
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "");
    vi.stubEnv("IP_HOURLY_AI_LIMIT", "1");

    const req1 = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: USER_A_ANSWERS, requestId: "req-journey-0007" }),
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    });
    await POST(req1);

    const req2 = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ answers: USER_A_ANSWERS, requestId: "req-journey-0008" }),
      headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    });
    const res2 = await POST(req2);
    const body2 = await res2.json();
    expect(body2.status).toBe("complete");
    expect(body2.mode).toBe("demo");
    expect(body2.demoReason).toBe("rate_limit");
  });
});
