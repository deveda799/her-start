# Supabase 单一数据源与人工审核设计

## 1. 目标

本次 MVP 取消飞书运行依赖，以 Supabase 作为唯一内容数据源和人工审核后台。

完整数据流：

```text
RSS / 公开网页 / 手动链接 / 可选 Brave Search
                    │
                    ▼
        过滤、URL 去重、AI 结构化与评分
                    │
                    ▼
       Supabase RPC ingest_opportunity
                    │
       新记录 pending / 非公开 / AI 草稿
                    │
                    ▼
        Supabase Table Editor 人工审核
                    │
                    ▼
   API / H5 只读取完整通过审核的公开记录
```

核心安全规则是：自动采集可以持续刷新机器字段，但永远不能覆盖珍妮的人工点评、审核状态或发布决策。

## 2. 架构决策

业务层通过 Provider 接口访问数据，不直接依赖 Supabase SDK。当前 MVP 的 `SupabaseProvider` 使用 Supabase PostgreSQL RPC 作为唯一写入入口。Node.js 采集程序不直接对 `opportunities` 执行通用 upsert。

RPC 使用 `source_url` 唯一约束去重，并在 SQL 中显式列出可写列：

- 新 URL：插入机器字段和人工字段默认值。
- 已存在 URL：只更新机器字段和同步时间。
- AI 新生成的点评写入 `ai_comment_suggestion`，不写入 `jenny_comment`。

选择 RPC 而不是应用层 read-then-update，原因是字段保护规则集中在数据库中，不会因以后调整 Node.js 映射而误覆盖人工字段。

### 2.1 Provider 边界

读取与写入拆成两个最小能力：

```ts
interface OpportunityDataProvider {
  listPublicOpportunities(
    query: OpportunityQuery,
  ): Promise<OpportunityListResult>;
  getPublicOpportunity(id: string): Promise<PublicOpportunity | null>;
}

interface OpportunityIngestProvider {
  ingestOpportunity(card: CaseCard): Promise<{
    recordId: string;
    action: "inserted" | "updated";
    needsJennyComment: boolean;
  }>;
}
```

`OpportunityQuery` 支持：

- 分页
- 标签
- 机会类型
- 风险等级
- 关键词

公开读取实现必须只返回同时满足以下条件的数据：

```text
status = published
is_public = true
jenny_comment_status = approved
jenny_comment 非空
```

### 2.2 Provider 实现

Provider 文件集中在 `src/lib/providers/`：

- `contracts.ts`：Provider 接口、查询和返回类型。
- `supabase-provider.ts`：当前 MVP 实现；Supabase SDK 和查询语法只能出现在该实现层。
- `local-json-provider.ts`：本地测试实现，支持公开读取和简单受控写入，不作为生产方案。
- `future-china-provider.ts`：只声明继承读取和写入能力的 `FutureChinaProvider` 接口，并保留迁移说明；不提供会假装成功的虚假实现。
- `provider-factory.ts`：按运行场景返回接口类型，不向业务层泄露具体实现。

`DATA_PROVIDER` 本次支持：

- `supabase`：默认值和生产 MVP。
- `local-json`：仅本地测试。

`future-china` 在有真实腾讯云、阿里云或 CloudBase 实现之前不能被选择，避免未实现能力进入生产。

`SupabaseProvider` 实现两个接口，但按运行场景只注入所需凭据：

- API 读取使用 anon key，受 RLS 限制。
- collect 写入使用 service role key，通过受控 RPC。

工厂对 API 返回 `OpportunityDataProvider`，对 collect 返回 `OpportunityIngestProvider`。业务模块无法调用不属于自身场景的能力。

## 3. 数据库迁移

新增 migration，不修改已经执行的 `001_create_opportunities.sql`。

### 3.1 新增字段

```sql
jenny_comment_status text not null default 'ai_draft'
jenny_comment_updated_at timestamptz
review_note text
ai_comment_suggestion text
raw_payload jsonb not null default '{}'::jsonb
```

`jenny_comment_status` 本次只允许：

- `ai_draft`
- `approved`

状态约束扩展为：

- `pending`
- `published`
- `unpublished`

### 3.2 唯一键

`source_url` 保持 `NOT NULL UNIQUE`。新 migration 会额外使用幂等语句确保唯一索引存在，RPC 以该列判断新增或重复。

### 3.3 RPC

函数名称：`public.ingest_opportunity(p_payload jsonb)`。

函数只授权 `service_role` 执行，并返回：

```text
record_id uuid
action text        -- inserted 或 updated
needs_jenny_comment boolean
```

写入流程：

1. 尝试插入新记录，显式设置：
   - `status = 'pending'`
   - `is_public = false`
   - `jenny_comment_status = 'ai_draft'`
   - `jenny_comment = null`
2. 如果 `source_url` 冲突，执行只包含机器字段的 `UPDATE`。
3. 返回 `inserted` 或 `updated`。

允许自动更新的列：

- `title`
- `source`
- `published_date`
- `opportunity_type`
- `audiences`
- `time_requirement`
- `skill_threshold`
- `risk_level`
- `ai_assistance`
- `summary`
- `action_suggestion`
- `score`
- `tags`
- `raw_payload`
- `ai_comment_suggestion`
- `last_synced_at`
- `updated_at`

RPC 永远不更新：

- `status`
- `is_public`
- `jenny_comment`
- `jenny_comment_status`
- `jenny_comment_updated_at`
- `review_note`
- `published_at`
- `unpublished_at`

即使记录已经公开发布，再次采集也不会打回待审核、清空点评或取消公开。

## 4. 采集程序

`collect` 保留现有信息源、过滤、AIClient、评分和 URL 规范化流程。

写入层改为 `OpportunityIngestProvider`。`collect` 不导入 Supabase SDK、Supabase 类型或 Supabase 查询模块。

映射规则：

- `CaseCard.jennyComment` → `ai_comment_suggestion`
- `CaseCard.scoreBreakdown` 与 `riskReason` → `raw_payload`
- 现有 TypeScript 字段继续映射到现有数据库列名，如：
  - `audiences`
  - `time_requirement`
  - `skill_threshold`
  - `ai_assistance`
  - `action_suggestion`

默认 `DATA_PROVIDER=supabase` 的非 dry-run 需要：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

dry-run 不连接 Supabase，只在控制台打印拟写入数据。

`DATA_PROVIDER=local-json` 只用于本地自动化测试或开发验证，不能配置到生产 workflow。

单条 RPC 失败时记录 `report.errors` 并继续处理其他卡片，不中断整个采集任务。

## 5. Daily report

删除飞书专用字段 `totalWrittenToFeishu`，新增：

- `totalWrittenToSupabase`
- `totalInserted`
- `duplicateUrls`
- `machineFieldsUpdated`
- `manualFieldsPreserved`
- `pendingJennyComments`

统计规则：

- RPC 返回 `inserted`：
  - `totalInserted += 1`
  - `totalWrittenToSupabase += 1`
- RPC 返回 `updated`：
  - `duplicateUrls += 1`
  - `machineFieldsUpdated += 1`
  - `manualFieldsPreserved += 1`
  - `totalWrittenToSupabase += 1`
- RPC 返回 `needs_jenny_comment = true`：
  - `pendingJennyComments += 1`

dry-run 不读取数据库，因此数据库写入类统计保持为 0；重复 URL 人工字段保护由自动化测试和 RPC SQL 契约测试覆盖。

## 6. 人工审核发布

珍妮直接在 Supabase Table Editor 查看 `opportunities`。

发布步骤：

1. 筛选并查看 `status = pending` 的内容。
2. 查看 `ai_comment_suggestion`，修改或确认 `jenny_comment`。
3. 将 `jenny_comment_status` 改为 `approved`。
4. 将 `status` 改为 `published`。
5. 将 `is_public` 改为 `true`。
6. 需要时填写 `jenny_comment_updated_at`、`review_note` 和 `published_at`。

自动采集不会执行以上人工操作。

## 7. H5、API 与 RLS

列表和详情必须同时满足：

```text
status = published
is_public = true
jenny_comment_status = approved
jenny_comment 非 NULL 且去除空白后非空
```

保护分为两层：

1. `SupabaseProvider` 查询显式包含审核状态和点评非空条件。
2. Supabase anon RLS policy 包含同样的完整条件。

因此即使未来 API 查询遗漏条件，anon 角色也无法读取未审核内容。

### 7.1 前台调用边界

H5 页面不导入 Supabase SDK，不创建 Supabase 客户端，也不直接调用 `OpportunityDataProvider`。

前台统一请求：

- `GET /api/opportunities`
- `GET /api/opportunities/[id]`

API route 获取 `OpportunityDataProvider` 后读取数据。列表 API 支持分页、标签、类型、风险和关键词参数；详情 API 只返回单条公开记录，不存在或未通过审核时返回 404。

H5 列表和详情改为通过相对路径请求 Next.js API。未来替换数据库时，只需新增 Provider 实现和调整工厂配置，页面、API 返回结构及 collect 主流程不需要重写。

## 8. 飞书与同步功能清理

从 MVP 运行路径中删除：

- `npm run sync:published`
- `.github/workflows/sync-published.yml`
- `scripts/sync-published.ts`
- 飞书到 Supabase 的同步实现和同步报告
- collect、环境校验、workflow 和 README 中的飞书引用

`src/lib/feishu` 及其独立测试可以保留为 future adapter，但不得被 CLI 或 MVP 业务模块导入。

GitHub Actions collect 只需要：

- 当前 AI provider 的 Key
- 可选 `BRAVE_SEARCH_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

不再需要任何 `FEISHU_*` Secret。

## 9. 国内部署兼容性

当前 MVP 使用 `SupabaseProvider`，Vercel 与 Supabase 适合开发测试和早期验证，但不承诺中国大陆访问稳定性。

正式面向中国大陆用户时，建议：

- 将 Next.js 部署到腾讯云、阿里云或 CloudBase 等国内环境。
- 为 `FutureChinaProvider` 增加真实的国内数据库或 CloudBase 实现。
- 将 GitHub Actions collect 迁移为国内云函数定时任务时，复用相同的 `OpportunityIngestProvider` 边界。
- 正式国内域名上线前评估 ICP 备案要求。

Provider 替换不改变 H5 API 契约，也不要求重写页面或采集业务流程。

## 10. 错误处理

- 环境缺失：生成空 daily-report，记录清晰启动错误并以非零状态退出。
- 单条 RPC 失败：记录 URL 对应错误，继续下一条。
- 全部来源为空：仍生成空 daily-report。
- dry-run：不创建 Supabase 客户端，不执行数据库 RPC。
- API 查询失败：维持现有受控错误响应，不回退到未审核数据。

日志和报告不得包含 API Key、service role key 或 Authorization header。

## 11. 测试与验收

最小自动化覆盖：

1. collect 非 dry-run 只要求 AI、Supabase service role 配置，不要求飞书。
2. 新记录 payload 使用 pending、非公开和 ai_draft 默认规则。
3. 重复 URL 映射和 RPC 更新列中不含任何人工审核字段。
4. 已发布记录再次采集时，人工字段保持不变。
5. AI 点评只写入 `ai_comment_suggestion`。
6. daily-report 的新增、重复、机器更新、人工保留和待点评统计正确。
7. API 列表和详情包含四项发布过滤条件。
8. migration 包含 `source_url` 唯一性和完整 RLS 条件。
9. dry-run 不调用 Supabase。
10. API route 只依赖 `OpportunityDataProvider`，collect 只依赖 `OpportunityIngestProvider`。
11. Local JSON 测试实现执行与生产相同的公开过滤规则。
12. H5 页面只请求 Next.js API，不导入 Supabase SDK。
13. 全量测试、TypeScript 类型检查和 Next.js 生产构建通过。

## 12. 不做范围

- 不开发独立审核管理页面。
- 不接入飞书审核或同步。
- 不实现腾讯云、阿里云或 CloudBase 的虚假适配器。
- 不做自动发布决策。
- 不允许 AI 自动批准点评。
- 不做会员、支付、社区或企业招聘后台。
- 不做数据库级版本历史界面。
