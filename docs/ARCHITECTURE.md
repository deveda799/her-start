# 架构说明

## 1. 三导航页面结构

比赛版采用三个固定底部导航：

- **首页 `/`**：主视觉卡（翡翠绿渐变）、进度条、当前任务入口、经验值/等级数据卡
- **关卡 `/levels`**：三张关卡卡片（看见自己 / 做成产品 / 走向市场），带锁定状态
- **我的 `/me`**：localStorage 进度、徽章、卡片摘要、品牌报告入口

底部导航：固定 64px、safe-area-inset-bottom、翡翠绿高亮、本地 SVG 图标。

## 2. 聊天式四问

`/interview` 页面采用聊天气泡形式：
- Value Mirror 在左侧，浅绿色 AI 气泡
- 用户回答显示在右侧，翡翠绿用户气泡
- 顶部显示「第一关 · 看见自己 问题 X/4」+ 进度条
- textarea 至少 120px，正文 16px，字数 500/3000 限制
- 支持上一步、修改回答、localStorage 恢复
- 第四问提供轻量选项 chips（不替代核心文字回答）

## 3. 动态追问判定流程

```
四问完成
  → AI 判断信息充分程度（第一次 AI 调用）
    → 信息充分：直接生成结果（第二次 AI 调用）
    → 信息不足：提出1个动态追问
      → 用户回答
      → 生成最终结果（第二次 AI 调用，followupUsed=true）
```

- 最多动态追问 1 次
- 完整流程最多调用 AI 两次
- `followupUsed=true` 时必须返回 `status=complete`
- 追问不超过 80 个汉字，基于用户具体内容

## 4. AI 请求和 Schema

```
POST /api/analyze

第一次请求：
{ "answers": string[4], "requestId": string }

返回：
  { "status": "needs_followup", "followup": { "question", "missingReason" } }
  或
  { "status": "complete", "result": HerStartAnalysis }

第二次请求：
{ "answers": string[4], "followup": { "question", "answer" }, "followupUsed": true }

必须返回：
  { "status": "complete", "result": HerStartAnalysis }
```

所有 AI 输出通过 Zod Schema 校验：
- `analysisSchema`：3 个 assets、最多 3 个 actions、至少 1 个 realUserContact
- `followupSchema`：question 最多 80 字
- `apiResponseSchema`：discriminated union

## 5. 服务端安全边界

- 同一 IP 每小时最多 10 次成功调用
- 项目每天最多 300 次成功调用
- 提交后禁用按钮（前端）
- 单题最多 500 字，总计不超过 3000 字
- 输出不超过 1500 字
- 超时 15s（追问判定）/ 25s（生成）
- 不记录用户完整回答
- 不暴露 API Key
- 限流时返回演示结果

## 6. localStorage

`her-start-v2` 键存储：
- answers[4]、step、result、isDemo、points
- followupQuestion、followupAnswer、createdAt

页面刷新和返回后恢复回答状态。

## 7. 积分系统

| 事件 | 经验值 |
|------|--------|
| 完成四问 | +20 |
| 生成人生资产卡 | +30 |
| 生成最小产品卡 | +30 |
| 领取行动卡 | +20 |
| **总计** | **100** |

等级：Lv1 初见(0) → Lv2 看见(20) → Lv3 成形(50) → Lv4 开局(100)

## 8. 品牌图片生成

- 客户端通过 `html-to-image` 生成 PNG
- 支持下载（普通浏览器）
- 支持长按保存（微信内置浏览器）
- 支持 Web Share API
- 不支持时提供复制链接兜底
- 生成失败提供精简分享卡
- 隐私：不含用户完整四问原文

## 9. 微信保存兜底

微信内置浏览器不支持 `download` 属性：
- 展示高清长图
- 提示「长按图片保存到手机」

## 10. 静默限流

后台限流不显示给用户：
- 达到额度返回演示结果
- 限流提示不显示技术信息
- 失败不计成功次数

## 11. 演示模式

无 API Key 时：
- 第一次请求返回演示追问
- 第二次请求返回完整演示结果
- 明确标注「当前展示演示结果」

## 12. 中国大陆部署

- 普通 HTTPS 链接直接打开
- 不依赖 Google Fonts、unpkg、jsDelivr
- 核心资源本地打包
- 浏览器不直接调用境外 AI
- 支持 safe-area-inset-bottom
- 不依赖 hover
- 简体中文

## 13. 比赛 MVP 限制

不做：注册登录、支付、会员、排行榜、14天任务、每日签到、社群、用户广场、微信授权、微信支付、复杂后台、多 Agent、实时市场数据、PDF 系统。
