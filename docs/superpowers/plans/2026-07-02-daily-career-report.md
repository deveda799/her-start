# Daily Career Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 H5 首页改造成可审核发布的“珍妮35+女性职业机会日报”，并让 collect 自动生成当天 Top10 日报。

**Architecture:** 扩展现有 Provider 合约承载日报公开读取和受控写入；Supabase 使用新增 migration/RPC，Local JSON 提供测试实现。首页只调用 Next.js 日报 API，不直接访问 Supabase。

**Tech Stack:** Next.js App Router、TypeScript、Tailwind CSS、Supabase PostgreSQL/RLS/RPC、Vitest

## Global Constraints

- 日报公开条件固定为 `status='published' AND is_public=true`。
- 自动任务不得覆盖日报或条目的人工字段。
- 上海时区决定“今日”日期。
- `/opportunities` 保留为二级页面。
- 不新增登录、支付、会员、社区、招聘、简历和小程序功能。

---

### Task 1: 日报类型、数据库与 Provider 合约

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/providers/contracts.ts`
- Create: `supabase/migrations/003_create_daily_reports.sql`
- Modify: `tests/providers/supabase-migration.test.ts`

**Interfaces:**
- Produces: `PublicDailyReport`、`DailyReportDraft`
- Produces: `getLatestPublicDailyReport(date)`、`getPublicDailyReportByDate(date)`、`ingestDailyReport(draft)`

- [ ] 写 migration 和合约失败测试。
- [ ] 运行目标测试，确认因日报结构缺失而失败。
- [ ] 添加类型、表、RLS、唯一索引和 `ingest_daily_report` RPC。
- [ ] 运行目标测试确认通过。

### Task 2: Provider 日报读写

**Files:**
- Modify: `src/lib/providers/supabase-provider.ts`
- Modify: `src/lib/providers/local-json-provider.ts`
- Modify: `src/lib/providers/future-china-provider.ts`
- Modify: `tests/providers/supabase-provider.test.ts`
- Modify: `tests/providers/local-json-provider.test.ts`

**Interfaces:**
- Consumes: Task 1 日报合约
- Produces: 公开日报映射和受控写入结果

- [ ] 写公开读取过滤和 RPC 载荷失败测试。
- [ ] 运行测试确认失败。
- [ ] 实现 Supabase 与 Local JSON 日报能力。
- [ ] 验证人工点评字段不会进入机器更新载荷。

### Task 3: 日报 API

**Files:**
- Create: `src/lib/api/reports-route-handlers.ts`
- Create: `src/lib/api/reports-api-client.ts`
- Create: `src/app/api/reports/today/route.ts`
- Create: `src/app/api/reports/[date]/route.ts`
- Create: `tests/web/reports-api.test.ts`
- Create: `tests/web/reports-api-client.test.ts`

**Interfaces:**
- Consumes: `OpportunityDataProvider`
- Produces: `/api/reports/today`、`/api/reports/[date]`

- [ ] 写今天回退、指定日期、无数据和日期校验测试。
- [ ] 运行测试确认路由处理器缺失。
- [ ] 实现处理器、路由与站内 API 客户端。
- [ ] 运行目标测试确认通过。

### Task 4: collect 生成日报

**Files:**
- Create: `src/lib/report/daily-report-draft.ts`
- Modify: `src/lib/collect/pipeline.ts`
- Modify: `tests/collect/pipeline.test.ts`
- Create: `tests/report/daily-report-draft.test.ts`

**Interfaces:**
- Consumes: 排序后的 `CaseCard` 和 opportunity `recordId`
- Produces: Top10 `DailyReportDraft`

- [ ] 写分布、统计、Top10 和写入失败测试。
- [ ] 运行测试确认失败。
- [ ] 实现确定性的趋势和行动建议生成。
- [ ] 在机会写入后调用 `ingestDailyReport`；dry-run 只打印。
- [ ] 运行目标测试确认通过。

### Task 5: 首页日报 UI

**Files:**
- Create: `src/components/reports/daily-report-view.tsx`
- Create: `src/components/reports/daily-report-empty.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/web/daily-report-view.test.tsx`

**Interfaces:**
- Consumes: `PublicDailyReport | null`
- Produces: 移动端优先日报阅读页

- [ ] 写标题、统计、Top10、可选点评、推荐标记和空状态测试。
- [ ] 运行测试确认组件缺失。
- [ ] 实现暖色头图、概览、榜单、趋势、行动建议和免责声明。
- [ ] 首页通过本站 API 获取日报；异常降级为空状态。
- [ ] 运行目标测试确认通过。

### Task 6: 文档与完整验证

**Files:**
- Modify: `README.md`
- Modify: `docs/tencent-cloud-deploy.md`

- [ ] 写清 migration 执行和 Supabase 人工发布步骤。
- [ ] 运行全部 Vitest。
- [ ] 运行 `tsc --noEmit`。
- [ ] 运行 Next.js production build。
- [ ] 检查前端无 Supabase SDK 引用、无真实密钥、工作区差异仅包含本功能。

