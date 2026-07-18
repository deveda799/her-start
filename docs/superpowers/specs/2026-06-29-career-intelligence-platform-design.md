# 珍妮职业机会情报平台 MVP 设计

> 本文保留初始架构记录。当前运行架构已由
> `2026-06-30-supabase-review-workflow-design.md` 取代；实现和部署请以后者及 README 为准。

## 1. 目标与架构

系统采用“自动采集 + 飞书审核 + Supabase 公开展示”模式：

1. GitHub Actions 每天运行采集 CLI。
2. 采集器从白名单公开来源获取内容，经规则和 AI 处理后写入飞书，状态为“待审核”。
3. 飞书是内容主数据源，人工将可靠内容改为“已发布”。
4. 同步 CLI 以飞书当前状态为准，将全部相关记录镜像到 Supabase。
5. Next.js H5 和 API 只读取 Supabase 中公开且已发布的数据。

采用一个 Next.js App Router + TypeScript 仓库，同时保留独立 CLI。采集、同步、API 和页面共享领域类型，但外部系统客户端彼此隔离。

选型说明：

- 采用单仓库模块化流水线，避免 MVP 阶段引入队列、数据库任务系统或插件框架。
- 搜索通过 `SearchProvider` 接口注入，Brave 不是业务逻辑的硬依赖。
- Supabase 采用软下架镜像，而不是追加写入或物理删除，以保证 H5 状态与飞书一致且保留历史。

技术栈：

- Node.js 20+
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- 飞书 OpenAPI
- OpenAI API
- GitHub Actions cron
- Vitest
- Zod

## 2. 项目目录结构

```text
.
├─ .github/
│  └─ workflows/
│     ├─ collect.yml
│     └─ sync-published.yml
├─ config/
│  └─ sources.json
├─ docs/
│  └─ superpowers/
│     ├─ specs/
│     └─ plans/
├─ output/
│  └─ .gitkeep
├─ scripts/
│  ├─ collect.ts
│  ├─ sync-published.ts
│  └─ daily-report.ts
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  └─ opportunities/
│  │  │     └─ route.ts
│  │  ├─ opportunities/
│  │  │  ├─ [id]/
│  │  │  │  └─ page.tsx
│  │  │  ├─ loading.tsx
│  │  │  └─ page.tsx
│  │  ├─ globals.css
│  │  └─ layout.tsx
│  ├─ components/
│  │  └─ opportunities/
│  │     ├─ opportunity-card.tsx
│  │     └─ opportunity-filters.tsx
│  └─ lib/
│     ├─ ai/
│     │  ├─ ai-client.ts
│     │  ├─ case-card-schema.ts
│     │  ├─ deepseek-ai-client.ts
│     │  └─ openai-case-card-generator.ts
│     ├─ collect/
│     │  ├─ collectors.ts
│     │  ├─ deduplicate.ts
│     │  ├─ filter.ts
│     │  └─ pipeline.ts
│     ├─ config/
│     │  ├─ env.ts
│     │  └─ sources.ts
│     ├─ feishu/
│     │  ├─ client.ts
│     │  └─ fields.ts
│     ├─ report/
│     │  └─ daily-report.ts
│     ├─ search/
│     │  ├─ brave-search-provider.ts
│     │  ├─ noop-search-provider.ts
│     │  └─ search-provider.ts
│     ├─ sources/
│     │  ├─ manual.ts
│     │  ├─ rss.ts
│     │  ├─ search.ts
│     │  └─ web.ts
│     ├─ supabase/
│     │  ├─ public-client.ts
│     │  └─ service-client.ts
│     ├─ sync/
│     │  └─ published-sync.ts
│     └─ types.ts
├─ supabase/
│  └─ migrations/
│     └─ 001_create_opportunities.sql
├─ tests/
│  ├─ collect/
│  ├─ report/
│  ├─ search/
│  ├─ sync/
│  └─ web/
├─ .env.example
├─ .gitignore
├─ next.config.ts
├─ package.json
├─ postcss.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
└─ README.md
```

每个文件只承担一个主要职责。CLI 负责装配依赖和退出码，不包含采集、同步或展示业务规则。

## 3. 数据流

### 3.1 自动采集

1. 读取并校验 `.env` 和 `config/sources.json`。
2. RSS、公开单页、手动链接和可选搜索源分别采集。
3. 所有结果归一化为 `RawItem`：
   - 标题
   - 原文链接
   - 摘要
   - 来源
   - 发布时间
   - 来源 ID
   - 来源类型
4. 规范化 URL，并按规范化 URL 进行本次运行内去重。
5. 用确定性规则过滤广告、刷单、交费就业、灰产、暴富承诺和低质量内容。
6. AI 清洗内容，生成标签、风险判断、五项评分和结构化案例卡。
7. 程序校验评分范围并重新计算总分，模型不负责最终求和。
8. 分页读取飞书已有“原文链接”，按 URL 跳过已存在记录。
9. 正式模式写入飞书，状态固定为“待审核”；dry-run 不访问飞书，打印搜索结果和拟写入数据。
10. 控制台打印汇总，并始终生成上海时区的 JSON 日报。

### 3.2 飞书审核与 Supabase 镜像

1. `sync:published` 分页读取飞书全部相关记录，而不是只读取“已发布”。
2. 匹配 Supabase 记录时优先使用 `feishu_record_id`，缺失时使用规范化原文 URL。
3. 飞书状态为“已发布”：
   - 新记录插入 Supabase。
   - 已有记录更新全部展示字段。
   - 设置 `status = 'published'`、`is_public = true`。
   - 首次发布时写入 `published_at`；重复同步不覆盖首次发布时间。
   - 清空 `unpublished_at`。
4. 飞书状态不是“已发布”：
   - 已存在的 Supabase 记录设置 `status = 'unpublished'`、`is_public = false`。
   - 状态从公开变为不公开时写入 `unpublished_at`。
5. 飞书中已删除、但 Supabase 仍公开的记录也软下架。
6. 所有被处理记录更新 `last_synced_at`。
7. 控制台输出新增、更新、下架、跳过和失败数量。单条失败不终止其他记录。

### 3.3 H5 与 API

1. `/api/opportunities` 只查询：
   - `is_public = true`
   - `status = 'published'`
2. API 支持 `tag`、`type`、`risk`、`page`、`pageSize` 查询参数，并按 `published_at`、`published_date` 倒序。
3. `/opportunities` 是手机端优先的卡片列表，筛选条件写入 URL 查询参数。
4. `/opportunities/[id]` 读取单条公开记录；不存在或已下架时返回 404。
5. 页面不直接使用 Supabase service role key；公开读取经服务端 API 完成。

## 4. 环境变量

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

# Feishu
FEISHU_APP_ID=<REDACTED>
FEISHU_APP_SECRET=<REDACTED>
FEISHU_APP_TOKEN=<REDACTED>
FEISHU_TABLE_ID=<REDACTED>

# Optional Brave Search
BRAVE_SEARCH_API_KEY=<REDACTED>
MAX_DAILY_SEARCH_QUERIES=30
MAX_ITEMS_PER_RUN=50

# Supabase
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=<REDACTED>
SUPABASE_SERVICE_ROLE_KEY=<REDACTED>
```

约束：

- `BRAVE_SEARCH_API_KEY` 可选。缺失时创建 `NoopSearchProvider`，其他来源正常运行。
- `AI_PROVIDER` 默认 `deepseek`，也可显式设为 `openai`；运行时不自动回退。
- `DEEPSEEK_BASE_URL` 默认 `https://api.deepseek.com`，`DEEPSEEK_MODEL` 默认 `deepseek-v4-flash`。
- `OPENAI_MODEL` 默认使用 `gpt-5.4-mini`，可按账户权限和成本要求覆盖。
- dry-run 只要求当前 AI provider 的 Key，不要求飞书或 Supabase 配置。
- `collect` 要求当前 AI provider 的 Key 和飞书配置。
- `sync:published` 要求飞书和 Supabase service role 配置。
- Next.js API 只要求 Supabase URL 和 anon key。
- 日志、报告和错误信息不得输出任何密钥或 Authorization header。

## 5. 飞书字段

飞书多维表字段：

| 字段 | 建议类型 | 写入规则 |
|---|---|---|
| 标题 | 单行文本 | AI 清洗后的标题 |
| 来源 | 单行文本 | 来源名称 |
| 原文链接 | URL | 规范化后的原文 URL |
| 发布日期 | 日期 | 原内容发布时间，可为空 |
| 机会类型 | 单选 | 工作机会/副业案例/AI 提效/灵活就业/避坑 |
| 适合人群 | 多选 | 35+女性/宝妈/职场转型者等 |
| 时间要求 | 多行文本 | AI 结构化结果 |
| 技能门槛 | 多行文本 | AI 结构化结果 |
| 风险等级 | 单选 | 低/中/高 |
| AI可辅助点 | 多行文本 | AI 结构化结果 |
| 案例摘要 | 多行文本 | AI 结构化结果 |
| 珍妮点评 | 多行文本 | AI 结构化结果 |
| 今日行动建议 | 多行文本 | AI 结构化结果 |
| 标签 | 多选 | AI 标签 |
| 评分 | 数字 | 0–100 |
| 状态 | 单选 | 默认“待审核”；人工可改 |
| 创建时间 | 日期 | 采集写入时间 |

评分总分 100：

- 人群匹配 25
- 痛点强度 25
- 实操价值 25
- 时效热度 15
- 风险可控 10

## 6. Supabase 表结构

表名：`opportunities`

```sql
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  feishu_record_id text unique,
  source_url text not null unique,
  title text not null,
  opportunity_type text not null,
  audiences text[] not null default '{}',
  time_requirement text,
  skill_threshold text,
  risk_level text not null,
  ai_assistance text,
  summary text not null,
  jenny_comment text,
  action_suggestion text,
  published_date date,
  source text not null,
  tags text[] not null default '{}',
  score integer not null check (score between 0 and 100),
  status text not null check (status in ('published', 'unpublished')),
  is_public boolean not null default false,
  published_at timestamptz,
  unpublished_at timestamptz,
  last_synced_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

索引：

- 唯一索引：`feishu_record_id`
- 唯一索引：`source_url`
- 列表索引：`(is_public, status, published_at desc)`
- GIN 索引：`tags`

安全策略：

- 开启 Row Level Security。
- anon 角色只能 `select` 同时满足 `is_public = true` 和 `status = 'published'` 的记录。
- anon 无写权限。
- 同步 CLI 使用仅存于服务端和 GitHub Secrets 的 service role key。

## 7. CLI 命令设计

| 命令 | 行为 |
|---|---|
| `npm run collect:dry` | 执行采集、过滤、AI 结构化和日报；打印搜索及拟写入数据；不读写飞书 |
| `npm run collect` | 执行完整采集，飞书 URL 查重后写入“待审核”记录，并生成日报 |
| `npm run sync:published` | 将飞书全部相关记录镜像到 Supabase，包含发布、更新和软下架 |
| `npm run daily-report` | 读取当日 JSON 日报并重新打印人类可读摘要；文件不存在时生成空报告 |

`daily-report` 输出路径：

```text
output/daily-report-YYYY-MM-DD.json
```

日期固定使用 `Asia/Shanghai`。即使零候选或部分来源失败也生成报告。

日报字段：

- `reportDate`
- `timezone`
- `dryRun`
- `totalCollected`
- `totalFiltered`
- `totalPassed`
- `totalWrittenToFeishu`
- `top10Candidates`
- `recommendedTop3`
- `highRiskItems`
- `sourceStats`
- `errors`
- `generatedAt`

## 8. SearchProvider 设计

```ts
interface SearchProvider {
  search(query: string): Promise<RawItem[]>;
}
```

实现：

- `BraveSearchProvider`：调用 Brave Web Search，仅读取标题、链接、摘要、来源和发布时间。
- `NoopSearchProvider`：返回空结果，并产生可记录的跳过原因。

`sources.json` 搜索源示例：

```json
{
  "id": "career-search",
  "name": "职业机会搜索",
  "type": "search",
  "provider": "brave",
  "keywords": ["35+ 女性 灵活就业", "宝妈 AI 副业案例"]
}
```

每个关键词计为一次请求；每日最多 `MAX_DAILY_SEARCH_QUERIES` 次。单个请求失败写入日报后继续。

## 9. GitHub Actions 设计

### collect.yml

- cron：每天 UTC 01:00，即北京时间 09:00。
- 安装 Node.js 20 和 npm 依赖。
- 运行测试或最小构建检查后执行 `npm run collect`。
- 使用 `if: always()` 上传当日日报。
- artifact 名称：`daily-report-YYYY-MM-DD`。
- 所有密钥来自 GitHub Actions Secrets。

### sync-published.yml

- cron：每小时运行一次，缩短人工审核后的展示延迟。
- 支持 `workflow_dispatch` 手动触发。
- 运行 `npm run sync:published`。
- 同步失败以非零状态退出；单条数据失败汇总后再设置退出状态，使日志保留完整统计。
- 每次运行尽量生成 `output/sync-report-YYYY-MM-DD-HH.json`，记录飞书读取数、Supabase upsert 数、发布/下架/跳过数、错误及成功状态。
- 使用 `if: always()` 上传 sync report artifact；报告生成失败时保留 Actions 日志且不阻塞 MVP 其他能力上线。

两个工作流不部署 H5。H5 可部署到 Vercel 或其他支持 Next.js 的平台，部署方法写入 README。

## 10. 错误处理与合规边界

- 来源、搜索关键词、AI 条目和同步记录分别隔离错误。
- Brave 失败不影响 RSS、Web 或 Manual。
- 不抓取登录、验证码、付费内容，不绕过 robots 限制。
- Web 来源只读取配置 URL 的公开单页，不做递归爬取。
- Brave 结果不继续抓取落地页。
- 飞书写入不自动重试，避免未知成功状态造成重复。
- Supabase 同步采用确定性匹配和 upsert；单条失败不阻塞其他记录。
- 任何启动错误也应尽量生成空或部分日报。

## 11. H5 页面设计

列表页 `/opportunities`：

- 手机端单列卡片，桌面端最多双列。
- 顶部提供机会类型、标签、风险等级筛选。
- 卡片展示标题、机会类型、适合人群、风险等级、摘要、来源、发布日期和评分。
- 使用“加载更多”分页，不实现无限滚动。
- 空结果、加载中和请求失败均有明确状态。

详情页 `/opportunities/[id]`：

- 展示用户指定的全部 H5 字段。
- 原文链接使用新窗口打开并标识外部链接。
- 高风险内容显示明显提示。
- 不展示飞书 record ID、内部状态、同步时间或其他运营字段。

## 12. 测试策略

使用 Vitest。纯逻辑使用真实输入测试；OpenAI、Brave、飞书和 Supabase 网络边界通过注入的 `fetch` 或客户端替身隔离。

重点覆盖：

1. 四类来源归一化。
2. Noop 降级、Brave 请求上限和部分失败继续。
3. URL 规范化、运行内去重和风险过滤。
4. AI 结构化 Schema 与程序重新计分。
5. 飞书分页 URL 查重及默认“待审核”。
6. 上海时区空日报、部分失败日报。
7. 同步按 record ID 优先、URL 回退。
8. 发布、更新、软下架、飞书删除后软下架。
9. API 只返回公开已发布数据及筛选分页。
10. 列表和详情页的关键渲染状态。

验收命令：

```text
npm test
npm run typecheck
npm run build
npm run collect:dry
```

真实飞书、DeepSeek/OpenAI、Brave 和 Supabase 联调需要用户提供本地 `.env`，密钥不得写入仓库。

## 13. MVP 开发步骤

1. 初始化 Next.js、TypeScript、Tailwind、测试和配置校验。
2. 定义领域类型、来源配置和 URL 规范化规则。
3. 以测试驱动实现 RSS、Web、Manual、SearchProvider 与 Brave/Noop。
4. 实现过滤、AI 案例卡、评分和采集流水线。
5. 实现飞书分页查重、写入及日报。
6. 创建 Supabase migration 和 RLS 策略。
7. 实现飞书到 Supabase 的镜像同步与统计日志。
8. 实现公开 API、H5 列表、标签筛选和详情页。
9. 添加两个 GitHub Actions 工作流。
10. 完成 README、`.env.example`、`sources.json` 示例和完整验证。

每一步保持可测试、可运行；当前一步验收后再进入下一步。

## 14. 暂不实现

- 会员、登录、付费和订阅。
- 评论、私信、社区、点赞或收藏。
- 企业招聘发布与职位管理。
- 公众号、飞书机器人和邮件自动推送。
- 复杂管理后台。
- `daily-report.md`。
- 多搜索供应商的具体实现；仅保留可替换接口。
- 队列、任务数据库、分布式抓取、代理池和反爬绕过。
- H5 在线编辑内容；内容审核只在飞书完成。
