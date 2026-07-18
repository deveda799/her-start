# DeepSeek / OpenAI AI Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 默认使用 DeepSeek 生成案例卡，同时通过统一 `AIClient` 保留可显式切换的 OpenAI 备用实现。

**Architecture:** 配置层按 `AI_PROVIDER` 条件校验密钥，CLI 装配层通过工厂选择 provider。采集流水线只依赖 `AIClient.generateCaseCard()`，两种实现共用案例卡 Schema、提示词、评分重算和错误隔离。

**Tech Stack:** TypeScript、Zod、OpenAI Node SDK、DeepSeek OpenAI-compatible Chat Completions、Vitest

## Global Constraints

- `AI_PROVIDER` 只允许 `deepseek` 或 `openai`，默认 `deepseek`。
- DeepSeek 默认 `DEEPSEEK_BASE_URL=https://api.deepseek.com`、`DEEPSEEK_MODEL=deepseek-v4-flash`。
- 只要求当前 provider 的 API key；另一 provider 的 key 可缺失。
- 不做运行时自动回退、重试、负载均衡或双重调用。
- 业务流水线不得导入 OpenAI SDK或读取 provider 环境变量。
- 不记录 API key、Authorization header 或完整敏感响应。

---

### Task 1: 条件环境变量校验

**Files:**
- Modify: `src/lib/config/env.ts`
- Modify: `tests/config/env.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `RuntimeEnv.aiProvider: "deepseek" | "openai"`
- Produces: `deepseekApiKey`, `deepseekBaseUrl`, `deepseekModel`

- [ ] **Step 1: 写失败测试**

```ts
it("defaults to DeepSeek and only requires its key", () => {
  const env = parseRuntimeEnv(
    { DEEPSEEK_API_KEY: "test-deepseek" },
    "collect-dry",
  );
  expect(env.aiProvider).toBe("deepseek");
  expect(env.deepseekBaseUrl).toBe("https://api.deepseek.com");
  expect(env.deepseekModel).toBe("deepseek-v4-flash");
  expect(env.openaiApiKey).toBeUndefined();
});

it("requires the selected provider key with a clear error", () => {
  expect(() => parseRuntimeEnv(
    { AI_PROVIDER: "deepseek" },
    "collect-dry",
  )).toThrow("AI_PROVIDER=deepseek requires DEEPSEEK_API_KEY");

  expect(() => parseRuntimeEnv(
    { AI_PROVIDER: "openai" },
    "collect-dry",
  )).toThrow("AI_PROVIDER=openai requires OPENAI_API_KEY");
});
```

- [ ] **Step 2: 运行 RED**

Run:

```powershell
npm.cmd test -- tests/config/env.test.ts
```

Expected: FAIL because DeepSeek configuration is absent and OpenAI is still mandatory.

- [ ] **Step 3: 实现条件校验**

Schema 新增：

```ts
AI_PROVIDER: z.enum(["deepseek", "openai"]).default("deepseek"),
DEEPSEEK_API_KEY: z.string().min(1).optional(),
DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
DEEPSEEK_MODEL: z.string().min(1).default("deepseek-v4-flash"),
```

collect / collect-dry 校验：

```ts
if (mode === "collect" || mode === "collect-dry") {
  if (parsed.AI_PROVIDER === "deepseek" && !parsed.DEEPSEEK_API_KEY) {
    throw new Error("AI_PROVIDER=deepseek requires DEEPSEEK_API_KEY");
  }
  if (parsed.AI_PROVIDER === "openai" && !parsed.OPENAI_API_KEY) {
    throw new Error("AI_PROVIDER=openai requires OPENAI_API_KEY");
  }
}
```

正式 collect 的飞书校验保持不变；sync/web 不校验 AI key。

- [ ] **Step 4: 更新 `.env.example`**

```dotenv
# AI provider: deepseek or openai
AI_PROVIDER=deepseek

# DeepSeek (default)
DEEPSEEK_API_KEY=<REDACTED>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash

# OpenAI (optional alternative)
OPENAI_API_KEY=<REDACTED>
OPENAI_MODEL=gpt-5.4-mini
```

- [ ] **Step 5: 验证并提交**

```powershell
npm.cmd test -- tests/config/env.test.ts
npm.cmd run typecheck
```

Expected: environment tests PASS and typecheck exits 0.

```text
git add src/lib/config/env.ts tests/config/env.test.ts .env.example
git commit -m "feat: add AI provider configuration"
```

---

### Task 2: 统一 AIClient 与 DeepSeek 适配器

**Files:**
- Create: `src/lib/ai/ai-client.ts`
- Create: `src/lib/ai/deepseek-ai-client.ts`
- Modify: `src/lib/ai/openai-case-card-generator.ts`
- Modify: `src/lib/ai/case-card-schema.ts`
- Modify: `src/lib/collect/pipeline.ts`
- Modify: `tests/ai/case-card.test.ts`
- Create: `tests/ai/ai-client.test.ts`
- Modify: `tests/collect/pipeline.test.ts`

**Interfaces:**
- Produces: `AIClient.generateCaseCard(item): Promise<CaseCard>`
- Produces: `createAIClient(config): AIClient`
- Consumes: `parseCaseCard(input, item, now)`

- [ ] **Step 1: 写工厂和 DeepSeek RED 测试**

使用注入的 OpenAI-compatible client，避免真实网络：

```ts
it("creates the selected provider", () => {
  expect(createAIClient({
    provider: "deepseek",
    apiKey: "test",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
  })).toBeInstanceOf(DeepSeekAIClient);
});

it("requests JSON output and parses the case card", async () => {
  const create = vi.fn(async () => ({
    choices: [{ message: { content: JSON.stringify(validAiPayload) } }],
  }));
  const client = new DeepSeekAIClient(
    { apiKey: "test", baseUrl: "https://api.deepseek.com", model: "deepseek-v4-flash" },
    { chat: { completions: { create } } },
    () => new Date("2026-06-30T00:00:00.000Z"),
  );

  const card = await client.generateCaseCard(rawItem);
  expect(create).toHaveBeenCalledWith(expect.objectContaining({
    model: "deepseek-v4-flash",
    response_format: { type: "json_object" },
    stream: false,
  }));
  expect(card.score).toBe(83);
});
```

另测空内容、非法 JSON 和 Schema 错误。

- [ ] **Step 2: 运行 RED**

```powershell
npm.cmd test -- tests/ai/ai-client.test.ts
```

Expected: FAIL because `AIClient` and DeepSeek adapter do not exist.

- [ ] **Step 3: 提取共享接口与提示词**

`src/lib/ai/ai-client.ts`：

```ts
export interface AIClient {
  generateCaseCard(item: RawItem): Promise<CaseCard>;
}

export type AIClientConfig =
  | { provider: "deepseek"; apiKey: string; baseUrl: string; model: string }
  | { provider: "openai"; apiKey: string; model: string };
```

将系统提示词从 OpenAI 专用文件移到 `case-card-schema.ts` 并导出，两个 provider 共用。

- [ ] **Step 4: 实现 DeepSeekAIClient**

构造默认协议客户端：

```ts
new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseUrl,
});
```

调用：

```ts
const completion = await client.chat.completions.create({
  model: config.model,
  messages: [
    { role: "system", content: `${caseCardSystemPrompt}\n只输出 JSON。` },
    { role: "user", content: JSON.stringify(item) },
  ],
  response_format: { type: "json_object" },
  stream: false,
});
```

内容为空时抛出 `DeepSeek returned no case card content`；否则 `JSON.parse` 后调用 `parseCaseCard`。

- [ ] **Step 5: 迁移 OpenAI 实现和流水线**

- `OpenAiCaseCardGenerator` 改名导出为 `OpenAIClient`。
- 方法从 `generate` 改为 `generateCaseCard`。
- pipeline dependency 从 `generator: CaseCardGenerator` 改为 `aiClient: AIClient`。
- pipeline 调用改为 `deps.aiClient.generateCaseCard(item)`。
- 测试夹具同步改名，不改变错误隔离行为。

- [ ] **Step 6: 运行测试并提交**

```powershell
npm.cmd test -- tests/ai tests/collect/pipeline.test.ts
npm.cmd run typecheck
```

Expected: provider and pipeline tests PASS.

```text
git add src/lib/ai src/lib/collect/pipeline.ts tests/ai tests/collect/pipeline.test.ts
git commit -m "feat: add DeepSeek AI client"
```

---

### Task 3: CLI、GitHub Actions 与文档迁移

**Files:**
- Modify: `scripts/collect.ts`
- Modify: `.github/workflows/collect.yml`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-29-career-intelligence-platform-design.md`

**Interfaces:**
- Consumes: `createAIClient(config)`
- Produces: DeepSeek-default cloud configuration

- [ ] **Step 1: 更新 CLI 装配**

根据 `env.aiProvider` 构造 discriminated config：

```ts
const aiClient = env.aiProvider === "deepseek"
  ? createAIClient({
      provider: "deepseek",
      apiKey: env.deepseekApiKey!,
      baseUrl: env.deepseekBaseUrl,
      model: env.deepseekModel,
    })
  : createAIClient({
      provider: "openai",
      apiKey: env.openaiApiKey!,
      model: env.openaiModel,
    });
```

传入 pipeline 的字段为 `aiClient`。

- [ ] **Step 2: 更新 collect workflow**

```yaml
AI_PROVIDER: deepseek
DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
DEEPSEEK_BASE_URL: https://api.deepseek.com
DEEPSEEK_MODEL: deepseek-v4-flash
OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
OPENAI_MODEL: gpt-5.4-mini
```

README Secrets 清单新增 `DEEPSEEK_API_KEY`，将 `OPENAI_API_KEY` 标记为可选备用。

- [ ] **Step 3: 更新 README 和总设计**

明确：

- 默认 DeepSeek。
- `AI_PROVIDER` 显式切换示例。
- 两种 provider 只需配置当前 key。
- 不自动回退。
- 缺 key 的准确错误消息。
- DeepSeek 官方 base URL 与模型默认值。

- [ ] **Step 4: 完整验证**

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Expected: all tests PASS, typecheck and build exit 0.

运行无密钥 dry-run：

```powershell
npm.cmd run collect:dry
```

Expected: non-zero exit, daily report contains `AI_PROVIDER=deepseek requires DEEPSEEK_API_KEY`, and no external write occurs.

- [ ] **Step 5: 安全审计与提交**

确认仓库中只有 `<REDACTED>` 假值，没有真实 API key。

```text
git add scripts/collect.ts .github/workflows/collect.yml README.md docs/superpowers/specs/2026-06-29-career-intelligence-platform-design.md
git commit -m "docs: configure DeepSeek as default AI"
```

推送：

```text
git push -u origin codex/add-deepseek-provider
```
