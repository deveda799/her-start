# 变更日志

## [0.2.0] - 2026-07-18

### 比赛版重构

#### 阶段一：安全清理
- 移除旧「女性职业机会平台」全部代码
- 删除 `/opportunities`、`/api/reports`、`/api/health` 等旧路由
- 删除 collect/search/feishu/supabase 等旧模块
- 删除 26 个旧测试文件
- package 名称从 `jenny-career-intelligence` 改为 `her-start`
- 移除旧依赖：supabase-js、cheerio、dotenv、openai、rss-parser、tsx

#### 阶段二：手机 H5 重构
- 三导航结构：首页 / 关卡 / 我的
- 翡翠绿设计系统（#0B5B45 → #39A37D）
- 聊天式四问界面
- 分析加载页（轮播文案 + 双环动画）
- 三张结果卡（人生资产卡 / 最小产品卡 / 24小时行动卡）
- localStorage 进度系统
- 底部固定导航（safe-area、本地 SVG 图标）

#### 阶段三：动态追问
- Zod 判别联合 Schema（needs_followup | complete）
- 最多一次动态追问，完整流程最多两次 AI 调用
- followupUsed=true 时强制返回 complete
- 追问不超过 80 个汉字
- 演示模式支持追问流程

#### 阶段四：品牌报告
- html-to-image 客户端生成 PNG
- 支持 Web Share API / 下载 / 复制链接
- 微信长按保存兜底
- 隐私确认弹窗
- 不含用户完整四问原文

#### 阶段五：稳定交付
- 无境外 CDN / 字体依赖
- 无 dangerouslySetInnerHTML
- 无 Emoji 图标
- 8 个测试全部通过
- TypeScript 零错误
- 生产构建成功
