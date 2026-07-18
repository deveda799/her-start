# 珍妮职业机会情报日报设计

## 目标

把首页从机会筛选入口改为每日可阅读、可审核、可发布的职业机会情报日报。机会库继续保留在 `/opportunities`，但不再承担首页职责。

## 数据边界

- `opportunities` 继续保存持续更新的机会主数据。
- `daily_reports` 保存一天一份的日报聚合、趋势和行动建议，`report_date` 唯一。
- `daily_report_items` 保存 Top10 当日快照，通过 `report_id + source_url` 去重。
- `collect` 只通过 `OpportunityIngestProvider` 写入机会和日报。
- H5/API 只通过 `OpportunityDataProvider` 读取日报。
- Supabase 查询和 RPC 只出现在 `SupabaseProvider`。

## 自动生成与人工字段保护

采集完成后按评分降序选择 Top10。程序生成数量统计、类型/人群/风险分布、趋势观察和四类用户行动建议。新日报默认 `pending + is_public=false`。

重复运行时允许更新日报和条目的机器字段，但不得覆盖：

- 日报：`status`、`is_public`、`jenny_daily_comment`、`published_at`
- 条目：`jenny_comment`、`jenny_recommended`

## 公开读取

公开日报必须同时满足：

```text
daily_reports.status = 'published'
AND daily_reports.is_public = true
```

`/api/reports/today` 查询上海时区今天或之前最近一份公开日报；`/api/reports/[date]` 查询指定日期的公开日报。首页只调用本站 API。API 失败或无数据都显示“今日情报正在整理中，请稍后查看。”

## 页面

首页按以下顺序呈现：

1. 暖色渐变头图与核心统计
2. 今日概览
3. Top10 排行榜
4. 可选珍妮点评与珍妮推荐标记
5. 趋势分布、关注方向和避坑提醒
6. 四类用户今日行动建议
7. 免责声明与“查看全部机会库”入口

移动端使用单列阅读流，大屏只扩大内容宽度和统计卡片列数，不引入复杂交互。

## 失败处理

- 单条 opportunity 写入失败时记录错误，其他内容继续。
- 日报写入失败时记录 `daily-report-write` 错误，不影响 JSON 运行报告生成。
- 无成功写入的机会时仍生成空的 pending 日报，保证后台能看到当天运行结果。
- dry-run 生成并打印日报草稿，但不写数据库。

## 验证

- migration 测试覆盖表、唯一约束、RLS 和受控 RPC。
- Provider 测试覆盖公开条件和人工字段保护。
- pipeline 测试覆盖 Top10、日报写入、dry-run 不写入和失败继续。
- API 测试覆盖今日回退、指定日期和 404。
- UI 测试覆盖日报结构、可选点评、推荐标记和友好空状态。

