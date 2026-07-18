# 她来开局 Her Start

> 女性人生资产发现与商业化 AI 陪练
>
> 看见你走过的路，做成你的第一个产品。

## 产品定位

**赛道**：赚钱（Coding Lady 2026 比赛项目）

**核心用户**：28—45 岁、有 3 年以上工作或生活经验，希望发展第二收入曲线，却不知道自己能卖什么的职场女性和宝妈。

**AI 角色**：Value Mirror 价值镜

**产品形式**：适配中国大陆手机和微信内置浏览器的 H5/Web 应用

## 核心流程

```
看见人生资产 → 识别值得商业化的资产 → 找到目标用户和付费问题
→ 生成第一个最小产品 → 获得未来24小时真实市场验证行动
```

用户最终带走：
1. 一张人生资产卡
2. 一张最小产品卡
3. 一张24小时行动卡
4. 一个「开局行动者」徽章
5. 一份可以保存和分享的品牌开局报告

## 技术栈

- **框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **AI**：OpenAI 兼容 API（通过环境变量配置，无 API 时进入演示模式）
- **Schema 校验**：Zod（所有 AI 输出必须通过 Schema 校验）
- **图片生成**：html-to-image（客户端生成品牌长图 PNG）
- **测试**：Vitest（8 个测试）
- **样式**：原生 CSS + 翡翠绿设计系统（无外部 CDN/字体）

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 测试
npm test

# 类型检查
npm run typecheck

# 生产构建
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

| 变量 | 说明 | 默认 |
|------|------|------|
| `APP_MODE` | 运行模式 | `competition` |
| `ENABLE_AI_FOLLOWUP` | 启用动态追问 | `true` |
| `GLOBAL_DAILY_AI_LIMIT` | 每日全局 AI 调用上限 | `300` |
| `IP_HOURLY_AI_LIMIT` | 单 IP 每小时调用上限 | `10` |
| `AI_API_KEY` | AI 服务密钥（留空则演示模式） | - |
| `AI_BASE_URL` | AI 服务地址 | - |
| `AI_MODEL` | AI 模型名 | - |
| `NEXT_PUBLIC_SITE_URL` | 站点地址（品牌报告署名） | - |

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 首页（主视觉卡 + 任务入口 + 数据卡） |
| `/levels` | 关卡页（三关地图） |
| `/interview` | 聊天式四问 + 动态追问 |
| `/analyzing` | AI 分析加载页 |
| `/result` | 结果页（三张卡 + 品牌报告） |
| `/me` | 我的（localStorage 进度） |
| `POST /api/analyze` | AI 分析接口 |

## 项目结构

```
src/
├── app/
│   ├── api/analyze/route.ts    # AI 分析 API
│   ├── page.tsx                # 首页
│   ├── levels/page.tsx        # 关卡页
│   ├── interview/page.tsx     # 聊天式四问
│   ├── analyzing/page.tsx     # 加载页
│   ├── result/page.tsx        # 结果页
│   ├── me/page.tsx            # 我的页
│   ├── layout.tsx
│   └── globals.css            # 翡翠绿设计系统
├── components/her-start/
│   ├── bottom-nav.tsx         # 底部导航
│   ├── brand-icons.tsx        # 品牌 SVG 图标
│   └── brand-report.tsx       # 品牌长图生成
└── lib/her-start/
    ├── schema.ts              # Zod Schema
    ├── analyze.ts             # AI 调用逻辑
    ├── demo.ts                # 演示数据
    └── use-progress.ts        # localStorage 进度
```

## 演示模式

无 API Key 时自动进入演示模式（珍妮案例）：
- 10 年以上互联网医疗运营经验
- 擅长医生资源拓展、项目运营和团队培训
- 擅长把复杂经验整理成 SOP
- 经常帮助别人梳理副业方向

演示模式会明确标注「当前展示演示结果，正式分析需要连接 AI 服务」。

## 限制（比赛 MVP）

不做：注册登录、支付、会员、排行榜、14天任务、每日签到、社群、用户广场、微信授权、微信支付、复杂后台、多 Agent、实时市场数据、PDF 系统。
