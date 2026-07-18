# 珍妮职业机会情报平台 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可每日采集职业情报、经飞书人工审核后镜像到 Supabase，并由 Next.js H5 公开展示的最小可运行系统。

**Architecture:** 单仓库包含 Next.js App Router 页面/API 与独立 TypeScript CLI。采集器统一输出领域对象，搜索供应商通过接口注入；飞书是主数据源，Supabase 是软下架的公开镜像，H5 仅查询公开已发布记录。

**Tech Stack:** Node.js 20+、Next.js App Router、TypeScript、Tailwind CSS、Vitest、Zod、OpenAI Responses API、飞书 OpenAPI、Brave Search API、Supabase PostgreSQL/JavaScript SDK、GitHub Actions

## Global Constraints

- 仅访问白名单公开来源，不绕过登录、验证码、robots 限制或付费墙。
- `BRAVE_SEARCH_API_KEY` 可选；缺失时使用 `NoopSearchProvider`。
- 去重键是规范化原文 URL；同步匹配优先 `feishu_record_id`，回退原文 URL。
- 飞书是主数据源；Supabase 使用 `published/unpublished` 和 `is_public` 软上下架，不物理删除。
- H5 只展示 `is_public = true AND status = 'published'` 的记录。
- 所有密钥只通过 `.env`/GitHub Secrets 注入，任何日志和测试夹具不得包含真实密钥。
- 每个任务遵循 RED → GREEN → REFACTOR；没有先失败的测试，不新增对应生产逻辑。
- 当前 Windows 环境有 Node.js 24.17.0，满足 Node.js 20+；应使用 `npm.cmd` 绕过 PowerShell 脚本执行策略。
- 当前环境没有可用 Git 命令；计划中的提交步骤仅在 Git 恢复后执行，不能伪称已提交。

---

## File Map

- `scripts/*.ts`：CLI 装配和退出码。
- `src/lib/types.ts`：跨子系统领域类型。
- `src/lib/config/*`：环境变量和来源配置校验。
- `src/lib/sources/*`：RSS、公开单页、手动链接、搜索来源。
- `src/lib/search/*`：可替换搜索供应商。
- `src/lib/collect/*`：去重、过滤和采集编排。
- `src/lib/ai/*`：结构化案例卡 Schema 与 OpenAI 客户端。
- `src/lib/feishu/*`：鉴权、分页读取、批量写入和字段转换。
- `src/lib/report/*`：上海时区日报生成和控制台摘要。
- `src/lib/sync/*`：飞书到 Supabase 的镜像规则。
- `src/lib/supabase/*`：公开读取与服务端写入客户端。
- `src/app/api/opportunities/route.ts`：公开列表 API。
- `src/app/opportunities/*`：H5 列表和详情。
- `supabase/migrations/*`：表、索引、RLS 和授权。
- `.github/workflows/*`：每日采集和每小时同步。

---

### Task 1: 初始化工程、领域类型和配置校验

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/lib/types.ts`
- Create: `src/lib/config/env.ts`
- Create: `src/lib/config/sources.ts`
- Create: `tests/config/env.test.ts`
- Create: `tests/config/sources.test.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `config/sources.json`

**Interfaces:**
- Produces: `parseRuntimeEnv(input, mode): RuntimeEnv`
- Produces: `loadSources(path): Promise<SourceConfig[]>`
- Produces: `RawItem`, `CaseCard`, `Opportunity`, `ReportError`, `SourceStat`

- [ ] **Step 1: 创建最小工程清单**

`package.json` 使用以下脚本和依赖，不增加队列、ORM 或状态管理库：

```json
{
  "name": "jenny-career-intelligence",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "collect:dry": "tsx scripts/collect.ts --dry-run",
    "collect": "tsx scripts/collect.ts",
    "sync:published": "tsx scripts/sync-published.ts",
    "daily-report": "tsx scripts/daily-report.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.50.0",
    "cheerio": "^1.1.0",
    "dotenv": "^17.0.0",
    "next": "^15.3.0",
    "openai": "^5.8.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "rss-parser": "^3.13.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "autoprefixer": "^10.4.0",
    "jsdom": "^26.1.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.20.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

Run:

```powershell
npm.cmd install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 2: 写环境变量失败测试**

`tests/config/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseRuntimeEnv } from "@/lib/config/env";

describe("parseRuntimeEnv", () => {
  it("allows dry-run without Feishu, Supabase, or Brave credentials", () => {
    const env = parseRuntimeEnv({ OPENAI_API_KEY: "test-openai" }, "collect-dry");
    expect(env.openaiModel).toBe("gpt-5.4-mini");
    expect(env.maxDailySearchQueries).toBe(30);
    expect(env.braveSearchApiKey).toBeUndefined();
  });

  it("requires Feishu credentials for collect", () => {
    expect(() => parseRuntimeEnv({ OPENAI_API_KEY: "test-openai" }, "collect"))
      .toThrow(/FEISHU_APP_ID/);
  });

  it("requires Feishu and Supabase service credentials for sync", () => {
    expect(() => parseRuntimeEnv({}, "sync")).toThrow(/FEISHU_APP_ID/);
  });
});
```

Run:

```powershell
npm.cmd test -- tests/config/env.test.ts
```

Expected: FAIL because `@/lib/config/env` does not exist.

- [ ] **Step 3: 实现最小环境配置**

`src/lib/config/env.ts` 必须：

```ts
import { z } from "zod";

export type RuntimeMode = "collect-dry" | "collect" | "sync" | "web";

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

export function parseRuntimeEnv(
  input: NodeJS.ProcessEnv | Record<string, string | undefined>,
  mode: RuntimeMode,
) {
  const common = z.object({
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MODEL: z.string().min(1).default("gpt-5.4-mini"),
    BRAVE_SEARCH_API_KEY: z.string().min(1).optional(),
    MAX_DAILY_SEARCH_QUERIES: positiveInt(30),
    MAX_ITEMS_PER_RUN: positiveInt(50),
    FEISHU_APP_ID: z.string().min(1).optional(),
    FEISHU_APP_SECRET: z.string().min(1).optional(),
    FEISHU_APP_TOKEN: z.string().min(1).optional(),
    FEISHU_TABLE_ID: z.string().min(1).optional(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  }).parse(input);

  const requireKeys = (keys: (keyof typeof common)[]) => {
    for (const key of keys) {
      if (!common[key]) throw new Error(`Missing required environment variable: ${key}`);
    }
  };

  if (mode === "collect-dry") requireKeys(["OPENAI_API_KEY"]);
  if (mode === "collect") {
    requireKeys([
      "OPENAI_API_KEY", "FEISHU_APP_ID", "FEISHU_APP_SECRET",
      "FEISHU_APP_TOKEN", "FEISHU_TABLE_ID",
    ]);
  }
  if (mode === "sync") {
    requireKeys([
      "FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_APP_TOKEN",
      "FEISHU_TABLE_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
    ]);
  }
  if (mode === "web") requireKeys(["SUPABASE_URL", "SUPABASE_ANON_KEY"]);

  return {
    openaiApiKey: common.OPENAI_API_KEY,
    openaiModel: common.OPENAI_MODEL,
    braveSearchApiKey: common.BRAVE_SEARCH_API_KEY,
    maxDailySearchQueries: common.MAX_DAILY_SEARCH_QUERIES,
    maxItemsPerRun: common.MAX_ITEMS_PER_RUN,
    feishuAppId: common.FEISHU_APP_ID,
    feishuAppSecret: common.FEISHU_APP_SECRET,
    feishuAppToken: common.FEISHU_APP_TOKEN,
    feishuTableId: common.FEISHU_TABLE_ID,
    supabaseUrl: common.SUPABASE_URL,
    supabaseAnonKey: common.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: common.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export type RuntimeEnv = ReturnType<typeof parseRuntimeEnv>;
```

- [ ] **Step 4: 写来源配置失败测试**

覆盖 RSS、Web、Manual、Search 的 discriminated union，并确认 search 缺 `keywords` 时失败。

```ts
it("parses all supported source types", () => {
  const parsed = parseSources([
    { id: "rss-1", name: "RSS", type: "rss", url: "https://example.com/feed.xml" },
    { id: "web-1", name: "Web", type: "web", url: "https://example.com/post" },
    { id: "manual-1", name: "Manual", type: "manual", items: [
      { url: "https://example.com/job", title: "远程工作" },
    ] },
    { id: "search-1", name: "Search", type: "search", provider: "brave", keywords: ["宝妈 AI"] },
  ]);
  expect(parsed).toHaveLength(4);
});
```

Run and expect FAIL because `parseSources` is missing.

- [ ] **Step 5: 实现类型与来源 Schema**

`src/lib/types.ts` 定义：

```ts
export type SourceType = "rss" | "web" | "manual" | "search";

export interface RawItem {
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string | null;
  sourceId: string;
  sourceType: SourceType;
}

export interface ScoreBreakdown {
  audienceFit: number;
  painStrength: number;
  actionability: number;
  timeliness: number;
  riskControl: number;
}

export interface CaseCard {
  title: string;
  source: string;
  sourceUrl: string;
  publishedDate: string | null;
  opportunityType: "工作机会" | "副业案例" | "AI提效" | "灵活就业" | "避坑";
  audiences: string[];
  timeRequirement: string;
  skillThreshold: string;
  riskLevel: "低" | "中" | "高";
  aiAssistance: string;
  summary: string;
  jennyComment: string;
  actionSuggestion: string;
  tags: string[];
  scoreBreakdown: ScoreBreakdown;
  score: number;
  riskReason: string;
  status: "待审核";
  createdAt: string;
}
```

`src/lib/config/sources.ts` 用 Zod discriminated union 校验，并导出 `parseSources` 与 `loadSources`。`config/sources.json` 放四类假值示例，默认 `enabled: false`，避免首次 dry-run 意外访问网络。

- [ ] **Step 6: 运行测试、类型检查并提交**

```powershell
npm.cmd test -- tests/config
npm.cmd run typecheck
```

Expected: all Task 1 tests PASS, typecheck exits 0.

Git available 时：

```text
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs src tests config .env.example .gitignore vitest.config.ts
git commit -m "chore: initialize career intelligence project"
```

---

### Task 2: 实现来源采集与可选 Brave Search

**Files:**
- Create: `src/lib/search/search-provider.ts`
- Create: `src/lib/search/brave-search-provider.ts`
- Create: `src/lib/search/noop-search-provider.ts`
- Create: `src/lib/sources/rss.ts`
- Create: `src/lib/sources/web.ts`
- Create: `src/lib/sources/manual.ts`
- Create: `src/lib/sources/search.ts`
- Create: `src/lib/collect/collectors.ts`
- Create: `tests/search/search-provider.test.ts`
- Create: `tests/sources/rss.test.ts`
- Create: `tests/sources/web.test.ts`
- Create: `tests/sources/manual.test.ts`

**Interfaces:**
- Consumes: `RawItem`, `SourceConfig`
- Produces: `SearchProvider.search(query): Promise<RawItem[]>`
- Produces: `collectSource(source, deps): Promise<SourceCollectionResult>`

- [ ] **Step 1: 写 Brave/Noop RED 测试**

测试必须验证：

```ts
it("uses Noop when the Brave key is absent", async () => {
  const provider = createSearchProvider(undefined, fetch);
  expect(provider).toBeInstanceOf(NoopSearchProvider);
  expect(await provider.search("宝妈 AI")).toEqual([]);
});

it("maps Brave web results without fetching result pages", async () => {
  const calls: string[] = [];
  const fakeFetch: typeof fetch = async (input, init) => {
    calls.push(String(input));
    expect(new Headers(init?.headers).get("X-Subscription-Token")).toBe("test-key");
    return Response.json({ web: { results: [{
      title: "远程顾问机会",
      url: "https://example.com/a",
      description: "适合有经验的转型者",
      profile: { long_name: "Example" },
      age: "2026-06-28T00:00:00Z"
    }] } });
  };
  const provider = new BraveSearchProvider("test-key", fakeFetch);
  const result = await provider.search("35+ 女性");
  expect(result[0].url).toBe("https://example.com/a");
  expect(calls).toHaveLength(1);
});
```

Run and confirm failure due to missing classes.

- [ ] **Step 2: 实现搜索接口与供应商**

`SearchProvider` 接口固定为：

```ts
export interface SearchProvider {
  search(query: string): Promise<RawItem[]>;
}
```

Brave endpoint 固定为：

```text
GET https://api.search.brave.com/res/v1/web/search?q=<query>&count=10&search_lang=zh-hans
X-Subscription-Token: <BRAVE_SEARCH_API_KEY>
Accept: application/json
```

只映射 `web.results`，不请求结果 URL。非 2xx 抛出不含 header/key 的错误。工厂只根据 key 选择 Brave 或 Noop。

- [ ] **Step 3: 写每日请求上限与部分失败 RED 测试**

```ts
it("stops after the daily query limit and continues after one query fails", async () => {
  const provider: SearchProvider = {
    search: async (query) => {
      if (query === "bad") throw new Error("search unavailable");
      return [{ title: query, url: `https://example.com/${query}`, summary: "",
        source: "Brave Search", publishedAt: null, sourceId: "s", sourceType: "search" }];
    },
  };
  const result = await collectSearchKeywords(
    ["first", "bad", "third", "fourth"], provider, 3, source,
  );
  expect(result.items.map((item) => item.title)).toEqual(["first", "third"]);
  expect(result.errors).toHaveLength(1);
  expect(result.skipped).toContain("daily search query limit reached");
});
```

- [ ] **Step 4: 实现四类来源**

- RSS：使用 `rss-parser`，只映射 feed 条目已有字段。
- Web：单次 fetch 配置 URL，Cheerio 读取 `title`、description、`article:published_time` 和正文纯文本前 1,500 字；不跟踪链接。
- Manual：不发网络请求，直接映射配置项。
- Search：调用注入的 provider，按关键词隔离错误并强制总请求上限。

所有 HTTP 客户端设置明确 User-Agent 和 15 秒 AbortSignal timeout；不自动重试。

- [ ] **Step 5: 运行来源测试并提交**

```powershell
npm.cmd test -- tests/search tests/sources
npm.cmd run typecheck
```

Expected: all source/search tests PASS.

Commit when Git is available:

```text
git add src/lib/search src/lib/sources src/lib/collect/collectors.ts tests/search tests/sources
git commit -m "feat: add public source collectors"
```

---

### Task 3: 实现 URL 去重、风险过滤和 AI 案例卡

**Files:**
- Create: `src/lib/collect/deduplicate.ts`
- Create: `src/lib/collect/filter.ts`
- Create: `src/lib/ai/case-card-schema.ts`
- Create: `src/lib/ai/openai-case-card-generator.ts`
- Create: `tests/collect/deduplicate.test.ts`
- Create: `tests/collect/filter.test.ts`
- Create: `tests/ai/case-card.test.ts`

**Interfaces:**
- Produces: `normalizeUrl(url): string`
- Produces: `deduplicateByUrl(items): { items; duplicates }`
- Produces: `filterRawItem(item): FilterDecision`
- Produces: `CaseCardGenerator.generate(item): Promise<CaseCard>`

- [ ] **Step 1: 写 URL 去重 RED 测试**

```ts
it("removes tracking parameters and deduplicates by normalized URL", () => {
  const items = [
    raw("https://Example.com/post/?utm_source=x#part"),
    raw("https://example.com/post"),
  ];
  const result = deduplicateByUrl(items);
  expect(result.items).toHaveLength(1);
  expect(result.duplicates).toHaveLength(1);
  expect(result.items[0].url).toBe("https://example.com/post");
});
```

规范化规则：

- 仅允许 `http:`/`https:`。
- hostname 小写。
- 移除 fragment。
- 移除 `utm_*`、`spm`、`from`、`source`、`ref`。
- query 参数排序。
- 非根路径移除末尾 `/`。

- [ ] **Step 2: 实现最小 URL 去重**

实现后运行该测试并确认 PASS。

- [ ] **Step 3: 写风险过滤 RED 测试**

覆盖：

- `刷单`、`先交费`、`保证月入`、`博彩`、`拉人头` 必须拒绝。
- 标题为空、URL 无效、标题与摘要合计少于 20 个中文/英文字符必须拒绝。
- 正常远程顾问案例通过。

`FilterDecision`：

```ts
type FilterDecision =
  | { passed: true }
  | { passed: false; reason: string; risk: "high" | "low-quality" };
```

- [ ] **Step 4: 写 AI Schema 和重算分 RED 测试**

```ts
it("clamps score components and recomputes the total", () => {
  const parsed = parseCaseCard(aiPayload({
    audienceFit: 99,
    painStrength: 20,
    actionability: 20,
    timeliness: 10,
    riskControl: 8,
  }), rawItem);
  expect(parsed.scoreBreakdown.audienceFit).toBe(25);
  expect(parsed.score).toBe(83);
  expect(parsed.sourceUrl).toBe(rawItem.url);
  expect(parsed.status).toBe("待审核");
});
```

Zod 上限分别为 25/25/25/15/10；程序覆盖模型返回的 `source`、`sourceUrl`、`publishedDate`、`status`、`createdAt` 和总分。

- [ ] **Step 5: 实现 OpenAI 结构化输出客户端**

使用 OpenAI Node SDK 的 Responses API 与 Zod structured output：

```ts
const response = await client.responses.parse({
  model,
  input: [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(item) },
  ],
  text: { format: zodTextFormat(aiCaseCardSchema, "career_case_card") },
});

if (!response.output_parsed) {
  throw new Error("OpenAI returned no structured case card");
}
return parseCaseCard(response.output_parsed, item, now());
```

Prompt 必须要求基于输入事实，不虚构收入、雇主、步骤或发布日期；风险不确定时从严标记。

- [ ] **Step 6: 运行测试并提交**

```powershell
npm.cmd test -- tests/collect tests/ai
npm.cmd run typecheck
```

Expected: all Task 3 tests PASS.

Commit when Git is available:

```text
git add src/lib/collect src/lib/ai tests/collect tests/ai
git commit -m "feat: add filtering and AI case cards"
```

---

### Task 4: 实现飞书客户端、采集流水线和每日报告

**Files:**
- Create: `src/lib/feishu/client.ts`
- Create: `src/lib/feishu/fields.ts`
- Create: `src/lib/report/daily-report.ts`
- Create: `src/lib/collect/pipeline.ts`
- Create: `scripts/collect.ts`
- Create: `scripts/daily-report.ts`
- Create: `tests/feishu/client.test.ts`
- Create: `tests/report/daily-report.test.ts`
- Create: `tests/collect/pipeline.test.ts`

**Interfaces:**
- Produces: `FeishuClient.listAllRecords()`
- Produces: `FeishuClient.batchCreate(cards)`
- Produces: `runCollect(options, deps): Promise<DailyReport>`
- Produces: `writeDailyReport(report, outputDir)`

- [ ] **Step 1: 写飞书分页和字段映射 RED 测试**

测试两页记录，确认 `page_token` 被使用并能从 URL 字段的字符串或 `{ link, text }` 结构取值。

飞书鉴权：

```text
POST /open-apis/auth/v3/tenant_access_token/internal
body: { app_id, app_secret }
```

记录读取：

```text
GET /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records?page_size=500&page_token=...
```

批量写入：

```text
POST /open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create
body: { records: [{ fields: ... }] }
```

任何 `code !== 0` 都抛出已脱敏错误。

- [ ] **Step 2: 实现字段转换**

`CaseCard` 到飞书字段严格映射：

```ts
{
  "标题": card.title,
  "来源": card.source,
  "原文链接": { link: card.sourceUrl, text: card.sourceUrl },
  "发布日期": card.publishedDate ? Date.parse(card.publishedDate) : null,
  "机会类型": card.opportunityType,
  "适合人群": card.audiences,
  "时间要求": card.timeRequirement,
  "技能门槛": card.skillThreshold,
  "风险等级": card.riskLevel,
  "AI可辅助点": card.aiAssistance,
  "案例摘要": card.summary,
  "珍妮点评": card.jennyComment,
  "今日行动建议": card.actionSuggestion,
  "标签": card.tags,
  "评分": card.score,
  "状态": "待审核",
  "创建时间": Date.parse(card.createdAt)
}
```

- [ ] **Step 3: 写空日报和上海日期 RED 测试**

使用固定 UTC 时间 `2026-06-28T16:30:00Z`，期望 `reportDate === "2026-06-29"`。确认零候选也创建：

```json
{
  "reportDate": "2026-06-29",
  "timezone": "Asia/Shanghai",
  "dryRun": true,
  "totalCollected": 0,
  "totalFiltered": 0,
  "totalPassed": 0,
  "totalWrittenToFeishu": 0,
  "top10Candidates": [],
  "recommendedTop3": [],
  "highRiskItems": [],
  "sourceStats": [],
  "errors": []
}
```

`generatedAt` 使用 ISO timestamp。

- [ ] **Step 4: 写完整内存流水线 RED 测试**

注入一个成功来源、一个失败来源、假 AI 和假飞书：

- dry-run 不调用飞书。
- 搜索结果通过注入 logger 打印。
- 来源错误出现在 `report.errors`。
- Top10 按分数倒序。
- recommendedTop3 排除高风险。
- 正式模式先按飞书 URL 去重，再以最多 100 条一批写入。

- [ ] **Step 5: 实现采集 CLI**

`scripts/collect.ts`：

```ts
import "dotenv/config";
import { runCollectCli } from "@/lib/collect/pipeline";

const dryRun = process.argv.includes("--dry-run");
runCollectCli({ dryRun }).catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown collect error");
  process.exitCode = 1;
});
```

流水线使用 `try/finally` 保证报告写入。配置启动错误生成空报告后非零退出；来源/AI/飞书条目错误继续处理并记录。

- [ ] **Step 6: 运行测试并提交**

```powershell
npm.cmd test -- tests/feishu tests/report tests/collect
npm.cmd run typecheck
```

Expected: all Task 4 tests PASS.

Commit when Git is available:

```text
git add src/lib/feishu src/lib/report src/lib/collect scripts tests/feishu tests/report
git commit -m "feat: collect opportunities into Feishu"
```

---

### Task 5: 创建 Supabase 表并实现飞书镜像同步

**Files:**
- Create: `supabase/migrations/001_create_opportunities.sql`
- Create: `src/lib/supabase/service-client.ts`
- Create: `src/lib/supabase/public-client.ts`
- Create: `src/lib/sync/published-sync.ts`
- Create: `scripts/sync-published.ts`
- Create: `tests/sync/published-sync.test.ts`

**Interfaces:**
- Produces: `syncPublished(feishuRecords, repository, now): Promise<SyncStats>`
- Produces: `SyncStats { inserted; updated; unpublished; skipped; failed; errors }`

- [ ] **Step 1: 写 migration**

SQL 必须创建设计文档中的全部列、唯一约束、列表索引、tags GIN 索引和 updated_at trigger。安全部分必须包含：

```sql
alter table public.opportunities enable row level security;

grant select on public.opportunities to anon;
grant all on public.opportunities to service_role;

create policy "public can read published opportunities"
on public.opportunities
for select
to anon
using (is_public = true and status = 'published');
```

不得给 anon insert/update/delete 权限。

- [ ] **Step 2: 写同步规则 RED 测试**

覆盖五个独立行为：

```ts
it("matches by Feishu record id before URL");
it("falls back to normalized URL when record id is absent");
it("publishes and preserves the first published_at");
it("soft-unpublishes records whose Feishu status changed");
it("soft-unpublishes public Supabase rows missing from Feishu");
```

每条失败记录增加 `failed` 并继续。字段缺少标题或 URL 时 `skipped`，不写入。

- [ ] **Step 3: 实现同步算法**

算法固定：

1. 一次分页读取飞书全部记录。
2. 一次分页读取 Supabase 全部镜像记录的最小匹配字段。
3. 建立 `byFeishuId`、`byNormalizedUrl` Map。
4. 对每条飞书记录计算期望状态并逐条 upsert/update。
5. 对仍公开但未在飞书快照出现的 Supabase 记录软下架。
6. 记录完整统计；有失败时 CLI 最后设置非零退出码。

发布字段：

```ts
{
  status: "published",
  is_public: true,
  published_at: existing?.published_at ?? nowIso,
  unpublished_at: null,
  last_synced_at: nowIso,
  updated_at: nowIso
}
```

下架字段：

```ts
{
  status: "unpublished",
  is_public: false,
  unpublished_at: existing?.is_public ? nowIso : existing?.unpublished_at,
  last_synced_at: nowIso,
  updated_at: nowIso
}
```

- [ ] **Step 4: 实现 Supabase repository**

service client 只在 CLI 入口创建，设置 `persistSession: false`。写入时：

- 已匹配记录使用 `.update(...).eq("id", id)`。
- 新记录使用 `.insert(...)`，依赖两个唯一约束防止竞态重复。
- 读取分页使用 `.range(from, to)`，直到返回数量小于 page size。

- [ ] **Step 5: 运行测试并提交**

```powershell
npm.cmd test -- tests/sync
npm.cmd run typecheck
```

Expected: all sync tests PASS.

Commit when Git is available:

```text
git add supabase src/lib/supabase src/lib/sync scripts/sync-published.ts tests/sync
git commit -m "feat: mirror reviewed content to Supabase"
```

---

### Task 6: 实现公开 Opportunities API

**Files:**
- Create: `src/app/api/opportunities/route.ts`
- Create: `src/lib/supabase/opportunities.ts`
- Create: `tests/web/opportunities-api.test.ts`

**Interfaces:**
- Produces: `parseOpportunityQuery(searchParams)`
- Produces: `listPublicOpportunities(query, client)`
- HTTP: `GET /api/opportunities`

- [ ] **Step 1: 写查询参数 RED 测试**

```ts
it("uses safe pagination defaults and caps page size", () => {
  expect(parseOpportunityQuery(new URLSearchParams())).toMatchObject({ page: 1, pageSize: 20 });
  expect(parseOpportunityQuery(new URLSearchParams("page=0&pageSize=999"))).toMatchObject({
    page: 1, pageSize: 50,
  });
});
```

筛选参数：`tag`、`type`、`risk`；空白值视为未筛选。

- [ ] **Step 2: 写公开约束 RED 测试**

repository 查询必须始终包含：

```ts
.eq("is_public", true)
.eq("status", "published")
```

并按 `published_at desc`、`published_date desc`，通过 range 分页。API 返回：

```ts
{
  items: Opportunity[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
```

- [ ] **Step 3: 实现 Route Handler**

- 无效参数返回 400。
- Supabase 错误记录脱敏服务端日志并返回 500 `{ error: "暂时无法获取情报" }`。
- 设置 `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`。
- 不返回 `feishu_record_id`、`last_synced_at` 等运营字段。

- [ ] **Step 4: 运行测试并提交**

```powershell
npm.cmd test -- tests/web/opportunities-api.test.ts
npm.cmd run typecheck
```

Commit when Git is available:

```text
git add src/app/api src/lib/supabase/opportunities.ts tests/web/opportunities-api.test.ts
git commit -m "feat: expose published opportunities API"
```

---

### Task 7: 实现手机端列表、筛选和详情页

**Files:**
- Create: `src/components/opportunities/opportunity-card.tsx`
- Create: `src/components/opportunities/opportunity-filters.tsx`
- Create: `src/app/opportunities/page.tsx`
- Create: `src/app/opportunities/loading.tsx`
- Create: `src/app/opportunities/[id]/page.tsx`
- Create: `tests/web/opportunity-card.test.tsx`
- Create: `tests/web/opportunity-filters.test.tsx`

**Interfaces:**
- Consumes: public `Opportunity`
- Route: `/opportunities`
- Route: `/opportunities/[id]`

- [ ] **Step 1: 写卡片 RED 测试**

确认卡片渲染标题、类型、人群、风险、摘要、来源、发布日期、评分和详情链接；高风险使用明确的文字标签，不能只依赖颜色。

- [ ] **Step 2: 实现卡片与基础样式**

视觉约束：

- 页面背景使用浅暖灰，卡片白色。
- 正文最小 16px，触控控件高度至少 44px。
- 手机单列；`md` 以上两列。
- 不引入组件库或图表库。

- [ ] **Step 3: 写筛选 RED 测试**

筛选组件改变 type/tag/risk 时更新 URL 查询参数并将 page 重置为 1。提供“清除筛选”按钮。

- [ ] **Step 4: 实现列表页**

服务端页面读取 search params，调用 repository 或内部共享查询函数，不通过浏览器自请求自身 API。显示：

- 筛选器。
- 卡片列表。
- 空结果状态。
- 上一页/下一页或“加载更多”链接。
- 请求失败的可恢复提示。

- [ ] **Step 5: 实现详情页**

按 `id` 查询时仍强制公开条件。未找到使用 `notFound()`。展示用户要求的全部字段，原文链接带：

```tsx
target="_blank" rel="noopener noreferrer"
```

高风险项显示风险理由或风险提示；不展示内部字段。

- [ ] **Step 6: 运行组件测试、构建并提交**

```powershell
npm.cmd test -- tests/web
npm.cmd run typecheck
npm.cmd run build
```

Expected: component/API tests PASS, Next.js build exits 0.

Commit when Git is available:

```text
git add src/app src/components tests/web
git commit -m "feat: add mobile opportunity pages"
```

---

### Task 8: GitHub Actions、README 和最终验证

**Files:**
- Create: `.github/workflows/collect.yml`
- Create: `.github/workflows/sync-published.yml`
- Create: `README.md`
- Modify: `.env.example`
- Modify: `config/sources.json`

**Interfaces:**
- Workflow: daily collect at UTC 01:00
- Workflow: hourly sync plus manual dispatch

- [ ] **Step 1: 创建 collect 工作流**

关键结构：

```yaml
name: Daily collect
on:
  schedule:
    - cron: "0 1 * * *"
  workflow_dispatch:
jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run collect
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          OPENAI_MODEL: gpt-5.4-mini
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_APP_TOKEN: ${{ secrets.FEISHU_APP_TOKEN }}
          FEISHU_TABLE_ID: ${{ secrets.FEISHU_TABLE_ID }}
          BRAVE_SEARCH_API_KEY: ${{ secrets.BRAVE_SEARCH_API_KEY }}
          MAX_DAILY_SEARCH_QUERIES: 30
      - id: report_date
        if: always()
        run: echo "date=$(TZ=Asia/Shanghai date +%F)" >> "$GITHUB_OUTPUT"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: daily-report-${{ steps.report_date.outputs.date }}
          path: output/daily-report-*.json
          if-no-files-found: warn
```

- [ ] **Step 2: 创建同步工作流**

```yaml
name: Sync published opportunities
on:
  schedule:
    - cron: "15 * * * *"
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run sync:published
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_APP_TOKEN: ${{ secrets.FEISHU_APP_TOKEN }}
          FEISHU_TABLE_ID: ${{ secrets.FEISHU_TABLE_ID }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

- [ ] **Step 3: 编写 README**

README 必须包含：

1. 三个子系统和数据流。
2. Node 20+ 安装与 `npm ci`。
3. 飞书自建应用、权限、字段类型和表 ID 配置。
4. Supabase migration 执行、RLS 和 service role 保密说明。
5. Brave Key 可选配置及 Noop 降级行为。
6. 四个 CLI 命令。
7. `sources.json` 四类示例。
8. GitHub Secrets 完整清单和两个 cron 的北京时间。
9. Vercel 部署所需 `SUPABASE_URL`、`SUPABASE_ANON_KEY`。
10. dry-run 不写飞书、不触碰 Supabase，但会调用已启用的公开来源和 OpenAI。
11. 常见错误：飞书权限、字段类型、Supabase RLS、空报告。
12. 安全边界和不做的功能。

- [ ] **Step 4: 执行完整验证**

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Expected:

- Vitest reports 0 failed tests.
- TypeScript exits 0.
- Next.js production build exits 0.

如果本地已配置测试用 `OPENAI_API_KEY`，使用仅启用 Manual 示例源的配置运行：

```powershell
npm.cmd run collect:dry
```

Expected:

- 不访问飞书或 Supabase。
- 控制台显示采集、筛选、Top10、Top3、高风险和错误摘要。
- 生成 `output/daily-report-<Asia/Shanghai date>.json`。

如果未配置 OpenAI 测试凭据，不伪造真实 dry-run 成功；改为运行完整流水线内存集成测试，并执行缺少配置的 CLI 路径，确认它生成空日报后非零退出。真实凭据联调由用户配置 `.env` 后单独执行，不把凭据或响应复制进 issue、日志、README 或提交。

- [ ] **Step 5: 最终范围审计**

逐项核对设计文档：

- collect 四类来源、AI、飞书待审核和日报。
- sync 发布、更新、软下架、删除镜像和统计。
- Supabase 表、索引、RLS。
- API 筛选分页且只读公开数据。
- H5 列表、标签筛选、详情。
- 两个 GitHub Actions。
- README、`.env.example`、`sources.json`。

确认未加入会员、支付、社区、企业招聘、复杂后台或自动发布。

Commit when Git is available:

```text
git add .github README.md .env.example config/sources.json
git commit -m "docs: add deployment and operations guide"
```
