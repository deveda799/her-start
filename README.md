# 她来开局 Her Start（比赛入口）

根页面现为“女性人生资产发现与商业化 AI 陪练”：通过四问生成一张人生资产卡、一个最小产品、未来 24 小时真实验证行动及“开局行动者”徽章。项目保留原有职业机会模块，未改动其独立路由。

## 本地运行

要求 Node.js 20+。复制 `.env.example` 为 `.env.local`；如暂不配置 AI，系统会明确进入演示模式。

```bash
npm ci
npm run dev
```

打开 `http://localhost:3000`。运行 `npm test`、`npm run typecheck` 和 `npm run build` 完成验证。模型通过 `AI_BASE_URL`、`AI_MODEL`、`AI_API_KEY` 接入 OpenAI 兼容服务，均为服务端配置，禁止使用 `NEXT_PUBLIC_` 前缀。

比赛模式、限流、部署、中国大陆网络验收与演示兜底见 `docs/ARCHITECTURE.md`、`docs/DEPLOY_CN.md` 和 `docs/DEMO.md`。当前 MVP 使用内存限流和浏览器本地存储，无账号、数据库、支付、历史报告与动态追问；真实 HTTPS 链接及大陆移动网络/微信实测仍需部署账号后完成。

---

# 珍妮职业机会情报平台（原有模块）

面向 35+ 女性、宝妈和职场转型者的职业机会情报 MVP。系统定时采集公开信息，用 AI 整理为结构化案例卡，写入内容数据源等待人工审核；H5 只展示已审核、已批准点评且已公开的内容。

## 数据流

```text
RSS / 公开单页 / 手动链接 / 可选 Brave Search
                      │
                      ▼
       URL 去重 → 风险过滤 → AI 结构化与评分
                      │
                      ▼
        OpportunityIngestProvider 受控写入
                      │
                      ▼
        Supabase opportunities（默认 pending）
                      │ 人工审核与确认珍妮点评
                      ▼
       OpportunityDataProvider 公开读取
                      │
                      ▼
 /api/opportunities → H5 /opportunities
```

当前 MVP 使用 `SupabaseProvider`。采集和 API 只依赖 Provider 接口，H5 页面只请求 Next.js API；以后更换国内数据库时，不需要重写页面和采集主流程。

## 功能范围

- RSS、公开单页和手动链接采集。
- Brave Search 可选接入；未配置 Key 时跳过搜索源。
- DeepSeek 默认、OpenAI 可选的统一 `AIClient`。
- URL 规范化去重、风险和低质量规则过滤。
- Supabase RPC 按 `source_url` 受控写入。
- 重复 URL 只更新机器字段，不覆盖人工审核字段。
- Supabase Table Editor 人工审核。
- 上海时区控制台日报和 JSON 日报。
- 手机端列表、关键词/标签/类型/风险筛选和详情页。
- Provider 抽象：
  - `SupabaseProvider`：当前 MVP。
  - `LocalJsonProvider`：仅本地测试。
  - `FutureChinaProvider`：国内云迁移接口边界，不含虚假实现。

不包含会员、支付、社区、企业招聘后台、自动发布决策或反爬绕过。

## 环境要求

- Node.js 20 或更高版本
- npm
- Supabase 项目
- DeepSeek API Key（默认）或 OpenAI API Key
- Brave Search API Key（可选）

安装：

```bash
npm ci
cp .env.example .env
```

Windows PowerShell 如果禁止执行 `npm.ps1`，使用 `npm.cmd`。

## 环境变量

真实值只放在本地 `.env`、部署平台 Secrets 或 GitHub Actions Secrets 中。

| 变量 | 必需场景 | 说明 |
|---|---|---|
| `AI_PROVIDER` | 可选 | `deepseek` 或 `openai`，默认 `deepseek` |
| `DEEPSEEK_API_KEY` | provider 为 deepseek 时 | DeepSeek API Key |
| `DEEPSEEK_BASE_URL` | 可选 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 可选 | 默认 `deepseek-v4-flash` |
| `OPENAI_API_KEY` | provider 为 openai 时 | OpenAI API Key |
| `OPENAI_MODEL` | 可选 | 默认 `gpt-5.4-mini` |
| `DATA_PROVIDER` | 可选 | `supabase` 或 `local-json`，默认 `supabase` |
| `LOCAL_JSON_DATA_PATH` | 本地测试 | 默认 `output/local-opportunities.json` |
| `BRAVE_SEARCH_API_KEY` | 可选 | 未配置时搜索源自动跳过 |
| `MAX_DAILY_SEARCH_QUERIES` | 可选 | 默认 30 |
| `MAX_ITEMS_PER_RUN` | 可选 | 每次最多送入 AI 的候选，默认 50 |
| `SUPABASE_URL` | Supabase collect / API | Supabase Project URL |
| `SUPABASE_ANON_KEY` | 可选 Supabase API | 只读公开 Key；配置时优先用于读取 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase collect / 自托管 API | 仅服务端使用，绝不能暴露给浏览器 |

`LocalJsonProvider` 只用于测试和本地验证，不应配置到生产 workflow。

## 信息源配置

编辑 `config/sources.json`。示例源默认禁用；替换为确认可公开访问的白名单来源后再启用。

RSS：

```json
{
  "id": "trusted-rss",
  "name": "可信职业媒体",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "enabled": true
}
```

公开单页不会递归抓取链接：

```json
{
  "id": "public-story",
  "name": "公开案例页",
  "type": "web",
  "url": "https://example.com/story",
  "enabled": true
}
```

手动链接：

```json
{
  "id": "manual-links",
  "name": "人工白名单",
  "type": "manual",
  "enabled": true,
  "items": [
    {
      "title": "公开案例",
      "url": "https://example.com/case",
      "summary": "已人工确认可公开访问的摘要"
    }
  ]
}
```

可选 Brave Search：

```json
{
  "id": "brave-opportunities",
  "name": "Brave 职业机会搜索",
  "type": "search",
  "provider": "brave",
  "keywords": ["35+ 女性 远程工作", "宝妈 灵活就业"],
  "enabled": true
}
```

未配置 `BRAVE_SEARCH_API_KEY` 时，搜索源由 `NoopSearchProvider` 跳过，其他来源继续运行。搜索失败只写入日报错误，不中断整体任务。

## Supabase 初始化

按顺序在 Supabase SQL Editor 执行：

1. `supabase/migrations/001_create_opportunities.sql`
2. `supabase/migrations/002_supabase_review_workflow.sql`
3. `supabase/migrations/003_create_daily_reports.sql`

第三个 migration 会创建 `daily_reports`、`daily_report_items`、公开读取 RLS 和
`ingest_daily_report(jsonb, jsonb)` 受控 RPC。日报按 `report_date` 去重，条目按
`report_id + source_url` 去重；重复采集只更新机器字段，不覆盖日报发布状态、
珍妮每日点评、条目珍妮点评或珍妮推荐。

第二个 migration 会：

- 保证 `source_url` 唯一。
- 增加人工点评状态、审核备注、AI 点评建议和原始 payload 字段。
- 创建 `ingest_opportunity(jsonb)` 受控 RPC。
- 只允许 service role 执行写入 RPC。
- 将 anon 公开读取限制为完整通过审核的记录。

自动采集的新记录默认：

```text
status = pending
is_public = false
jenny_comment_status = ai_draft
```

重复 URL 只更新机器字段。以下字段不会被自动覆盖：

```text
status
is_public
jenny_comment
jenny_comment_status
jenny_comment_updated_at
review_note
published_at
```

AI 重新生成的点评建议写入 `ai_comment_suggestion`。

## 人工审核与发布

在 Supabase Table Editor 打开 `opportunities`：

1. 筛选并查看 `status = pending` 的内容。
2. 查看 `ai_comment_suggestion`，修改或确认 `jenny_comment`。
3. 将 `jenny_comment_status` 改为 `approved`。
4. 将 `status` 改为 `published`。
5. 将 `is_public` 改为 `true`。
6. 可填写 `jenny_comment_updated_at`、`review_note` 和 `published_at`。

H5/API/RLS 只返回同时满足以下条件的记录：

```text
status = published
is_public = true
jenny_comment_status = approved
jenny_comment 非空
```

日报审核在 Supabase Table Editor 中完成：

1. 打开 `daily_reports`，找到当天 `status = pending` 的记录。
2. 查看趋势、行动建议和 `daily_report_items` Top10 快照。
3. 可选填写 `daily_reports.jenny_daily_comment`。
4. 可选填写条目的 `jenny_comment`，重点内容可将 `jenny_recommended` 改为 `true`。
5. 确认后把日报 `status` 改为 `published`，并将 `is_public` 改为 `true`。
6. 可填写 `published_at`。珍妮点评不是日报公开的必填条件。

首页只展示 `status = published AND is_public = true` 的日报；当天没有已发布日报时，
自动回退到最近一份已发布日报。

## CLI

```bash
# 采集、过滤、AI 整理和预览，不连接内容数据源
npm run collect:dry

# 采集并通过 OpportunityIngestProvider 写入当前数据源
npm run collect

# 重新打印当日 JSON 日报；文件不存在时生成空报告
npm run daily-report
```

dry-run 仍会访问已启用的公开来源、可选 Brave Search 和当前 AI provider，但不会写入 Supabase 或 Local JSON。

## Daily report

每次采集都会生成：

```text
output/daily-report-YYYY-MM-DD.json
```

日期使用 `Asia/Shanghai`。即使没有候选或启动失败，也尽量生成报告。

主要统计：

- 今日采集、过滤和通过数量
- 写入数据源数量
- 新增记录数量
- 重复 URL 数量
- 更新机器字段数量
- 保留人工字段数量
- 待珍妮点评数量
- Top10、推荐发布 Top3、高风险提醒
- 来源统计和错误/跳过原因

## H5 与 API

H5 页面不创建 Supabase 客户端，只请求：

- `GET /api/reports/today`
- `GET /api/reports/[date]`
- `GET /api/opportunities`
- `GET /api/opportunities/[id]`

首页 `/` 是“珍妮35+女性职业机会日报”，`/opportunities` 是二级机会库。

列表参数：

| 参数 | 示例 |
|---|---|
| `type` | `工作机会` |
| `tag` | `远程` |
| `risk` | `低` |
| `keyword` | `顾问` |
| `page` | `1` |
| `pageSize` | `20`，最大 50 |

API 层通过 `OpportunityDataProvider` 读取数据。更换 Provider 不改变 H5 页面和 API 返回结构。

## GitHub Actions

`.github/workflows/collect.yml`：

- 每天 UTC 01:00，即北京时间 09:00 运行 `npm run collect`。
- 支持 `workflow_dispatch` 手动补跑。
- 使用 `if: always()` 上传 `daily-report-YYYY-MM-DD` artifact。
- 不依赖本地电脑或 Codex 在线。

GitHub Secrets：

```text
AI_PROVIDER
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BRAVE_SEARCH_API_KEY         # 可选
```

H5 部署环境配置：

```text
DATA_PROVIDER=supabase
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## 上线步骤

1. 在 Supabase 按顺序执行三个 migration。
2. 在 GitHub Actions Secrets 配置采集所需密钥。
3. 手动运行 `Daily collect`，检查 pending 记录和 daily-report artifact。
4. 按人工审核步骤发布一条记录。
5. 部署 Next.js，配置 H5 读取环境变量。
6. 验证 `/api/reports/today`、首页日报和 `/api/opportunities`。
7. 保留 cron 进行每日自动采集。

## 中国大陆访问说明

当前腾讯云部署不依赖 Vercel。Vercel 与 Supabase 的组合可用于开发测试和早期验证，但不保证中国大陆访问稳定。

正式面向国内用户时建议：

- 将 Next.js 部署到腾讯云、阿里云或 CloudBase 等国内环境。
- 为 `FutureChinaProvider` 增加真实的国内数据存储实现。
- 将 GitHub Actions collect 迁移为国内云函数定时任务时，复用 `OpportunityIngestProvider`。
- 国内正式域名上线前评估 ICP 备案要求。

由于 H5 只调用 Next.js API，collect 只调用写入 Provider，更换数据库不需要重写页面或采集主流程。

腾讯云 OpenCloudOS 一键部署请参阅：

- [`docs/tencent-cloud-deploy.md`](docs/tencent-cloud-deploy.md)
- 部署脚本：`scripts/deploy-tencent-opencloudos.sh`
- Nginx 模板：`deploy/nginx/jenny-career-opportunity-h5.conf`

服务器首次启动命令：

```bash
sudo bash -c 'dnf install -y git && if [ ! -d /opt/jenny-career-opportunity-h5/.git ]; then git clone --branch main --single-branch https://github.com/deveda799/jenny-career-opportunity-h5.git /opt/jenny-career-opportunity-h5; fi && chmod +x /opt/jenny-career-opportunity-h5/scripts/deploy-tencent-opencloudos.sh && /opt/jenny-career-opportunity-h5/scripts/deploy-tencent-opencloudos.sh'
```

## 本地验证

```bash
npm test
npm run typecheck
npm run build
```

默认真实 dry-run 需要 `DEEPSEEK_API_KEY`；使用 `AI_PROVIDER=openai` 时需要 `OPENAI_API_KEY`。缺少对应 Key 时，CLI 会生成包含明确启动错误的空日报并以非零状态退出。

## 安全边界

- 不抓取登录、验证码或付费内容。
- 不绕过 robots 限制，不做递归爬取或代理池。
- service role key 只用于服务端 collect/API Provider，不能使用 `NEXT_PUBLIC_` 前缀。
- 不输出 API Key、Secret、Token 或 Authorization header。
- 示例值只使用假值或 `<REDACTED>`。
- 如果真实密钥曾提交到 Git，应立即轮换并清理 Git 历史。
