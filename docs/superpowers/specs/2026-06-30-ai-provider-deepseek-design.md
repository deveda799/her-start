# DeepSeek / OpenAI AI Provider 设计

## 目标

将案例卡 AI 调用从 OpenAI 专用实现改为可选择的 provider。默认使用 DeepSeek，OpenAI 保留为显式选择的备用；不做运行时自动回退。

## 配置

新增：

```dotenv
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=<REDACTED>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

保留：

```dotenv
OPENAI_API_KEY=<REDACTED>
OPENAI_MODEL=gpt-5.4-mini
```

规则：

- `AI_PROVIDER` 只允许 `deepseek` 或 `openai`，默认 `deepseek`。
- collect 和 collect:dry 只要求当前 provider 的 API key。
- `AI_PROVIDER=deepseek` 且缺少 `DEEPSEEK_API_KEY` 时，错误为：`AI_PROVIDER=deepseek requires DEEPSEEK_API_KEY`。
- `AI_PROVIDER=openai` 且缺少 `OPENAI_API_KEY` 时，错误为：`AI_PROVIDER=openai requires OPENAI_API_KEY`。
- 非当前 provider 的 key 可以不配置。
- sync 和 H5 不校验任何 AI key。

## 统一接口

业务流水线只依赖：

```ts
export interface AIClient {
  generateCaseCard(item: RawItem): Promise<CaseCard>;
}
```

实现：

- `DeepSeekAIClient`
- `OpenAIClient`

工厂：

```ts
createAIClient(config: AIClientConfig): AIClient
```

provider 选择只发生在 CLI 装配层。采集流水线不导入 OpenAI SDK、不读取 provider 环境变量，也不包含 provider 分支。

## DeepSeek 实现

DeepSeek 官方接口兼容 OpenAI Chat Completions：

- Base URL：`https://api.deepseek.com`
- Model：`deepseek-v4-flash`
- Endpoint：`/chat/completions`
- JSON Output：`response_format: { type: "json_object" }`

实现复用现有 `openai` npm SDK，但只作为协议客户端：

```ts
new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: deepseekBaseUrl,
});
```

请求包含现有系统提示词和序列化后的 `RawItem`。系统提示词明确要求只输出符合案例卡 Schema 的 JSON。

响应处理：

1. 获取 `choices[0].message.content`。
2. 内容为空时抛出 `DeepSeek returned no case card content`。
3. `JSON.parse`。
4. 使用现有 `parseCaseCard` 做 Zod 校验、来源字段覆盖和评分重算。

不调用搜索、工具、流式输出或自动重试。

## OpenAI 实现

保留现有 Responses API + `zodTextFormat` 结构化输出。类改名为 `OpenAIClient` 并实现统一 `AIClient`，对外方法改为 `generateCaseCard`。

## 数据流

```text
env conditional validation
        │
        ▼
createAIClient(provider config)
        │
        ▼
collect pipeline → AIClient.generateCaseCard()
        │
        ▼
parseCaseCard() → CaseCard
```

DeepSeek 与 OpenAI 共用：

- 案例卡 Zod Schema
- 系统提示词
- `parseCaseCard`
- 评分范围及程序重算
- 单条失败隔离和 daily-report 错误记录

## GitHub Actions

collect workflow 默认：

```yaml
AI_PROVIDER: deepseek
DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
DEEPSEEK_BASE_URL: https://api.deepseek.com
DEEPSEEK_MODEL: deepseek-v4-flash
OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
OPENAI_MODEL: gpt-5.4-mini
```

`OPENAI_API_KEY` 是可选 Secret。切换到 OpenAI 时，在 workflow 或仓库变量中显式修改 `AI_PROVIDER`。

## README

README 说明：

- DeepSeek 是默认 provider。
- 两种 provider 的环境变量和切换方式。
- 只需配置当前 provider 的 key。
- 没有自动回退。
- GitHub Actions Secrets 新增 `DEEPSEEK_API_KEY`。
- `OPENAI_API_KEY` 改为可选备用。

## 测试

1. 默认 provider 为 DeepSeek。
2. 两种 provider 的条件 key 校验和清晰错误。
3. `createAIClient` 返回正确实现。
4. DeepSeek 请求使用配置的 base URL、model 和 JSON Output。
5. DeepSeek 正常 JSON 通过现有 Schema 生成并重算评分。
6. DeepSeek 空内容、非法 JSON、Schema 错误均失败。
7. OpenAI 现有行为保持。
8. 采集流水线只依赖 `AIClient`，provider 错误仍按单条记录写入日报。

## 不做

- DeepSeek 失败后自动调用 OpenAI。
- 多 provider 负载均衡。
- provider 级重试、熔断或费用路由。
- 在日志中输出 API key、Authorization header 或完整敏感响应。
