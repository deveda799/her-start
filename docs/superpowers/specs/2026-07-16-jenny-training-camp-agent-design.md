# 珍妮训练营运营助理 Agent 一期设计

## 1. 目标

一期交付一个完全运行在测试数据上的最小闭环：飞书应用机器人接收学员私聊或群聊中的 @ 消息，识别提问或作业，读取一份指定测试课程文档，将处理结果写入测试多维表格，生成待审核回复，并且只在珍妮明确批准后发送给学员。

所有 AI 回复都必须经过珍妮审核。系统不得读取或修改正式知识库、正式学员名单或其他正式飞书资料，也不得自行扩大权限或部署到正式环境。

## 2. 已确认决策

- 采用方案 A：独立 Node.js/TypeScript Agent Worker。
- 一期使用飞书官方 SDK 长连接接收事件和卡片回调。
- 飞书官方 CLI 仅用于授权、配置、资源初始化和验收，不作为常驻运行时。
- 文档、多维表格和消息操作使用飞书官方 OpenAPI/SDK。
- 测试 Base 保存业务记录、审核状态和可见运行日志。
- 单实例一期使用 SQLite 保存事务性幂等状态，后续可替换为 PostgreSQL。
- 一期所有 AI 回复都进入 `pending_review`，不允许自动发送。

## 3. 范围

### 3.1 一期包含

- 接收机器人私聊消息和群聊中 @ 机器人的消息。
- 将消息识别为提问、作业或其他。
- 识别测试训练营期数、课程天数和问题类别。
- 通过固定文档 URL 读取一个测试课程知识源。
- 提取作业中的学员姓名、课程天数、作业内容和提交时间。
- 写入一个测试 Base 应用。
- 生成回答或点评草稿。
- 向珍妮发送审核卡片。
- 珍妮批准后只发送一次。
- 记录关键运行步骤、失败原因和重试状态。

### 3.2 一期不包含

- 正式课程知识库和正式学员名单。
- 群聊全部消息读取。
- 未审核 AI 回复自动发送。
- 高频问题、优秀作业、学员报喜自动归档。
- 运营日报、批量触达和正式环境部署。
- 新增权限、删除资源、移动正式文件或修改正式知识库。

## 4. 系统架构

```text
Feishu IM
  -> Official SDK long connection
  -> Event validation and deduplication
  -> Message router
     -> Question flow -> course resolver -> document retriever
     -> Homework flow -> homework parser -> Base repository
  -> AI draft generator
  -> Review workflow
  -> Jenny review card
  -> Approved outbound sender
  -> Audit log and idempotency store
```

Agent Worker 是独立常驻进程，不依赖 Next.js 请求生命周期。它可以与当前应用共用仓库、配置规范和 AI Provider 模式，但不接入现有职业机会采集流程。

### 4.1 运行时边界

- `MessageGateway`：接收事件、发送审核卡片和学员回复。
- `KnowledgeProvider`：按固定测试文档 URL 获取课程内容。
- `SubmissionRepository`：读写测试 Base 中的消息、作业和日志。
- `IdempotencyStore`：原子占用事件、审批动作和发送任务。
- `DraftGenerator`：分类、字段提取和回复草稿生成。
- `ReviewWorkflow`：控制允许的状态转换和审批人校验。

## 5. 用户交互流程

### 5.1 提问

1. 学员私聊机器人或在测试群中 @ 机器人。
2. 系统以 `event_id` 和 `message_id` 去重。
3. 系统识别训练营期数、课程天数和问题类别。
4. 缺少必要信息时，生成补充问题草稿并进入审核，不自行猜测。
5. 信息完整时，读取固定测试课程文档并生成回答草稿。
6. 系统向珍妮发送审核卡片。
7. 珍妮批准后，系统回复原消息并保存发送消息 ID。

### 5.2 作业

1. 系统识别作业意图并提取姓名、课程天数、正文和提交时间。
2. 缺少姓名或课程天数时，生成补充问题草稿并进入审核。
3. 字段完整时，系统写入 `作业审核` 表并生成初步点评。
4. 点评保持 `pending_review`，并向珍妮发送审核卡片。
5. 珍妮批准后，系统向学员发送一次点评并标记 `sent`。

## 6. 状态机

```text
received
  -> processing
  -> pending_review
  -> approved -> sending -> sent
  -> rejected
  -> failed
```

允许的人工操作只有 `pending_review -> approved` 和 `pending_review -> rejected`。发送只能由 `approved` 触发。`sent`、`rejected` 和不可重试的 `failed` 是终态。

重试不得回退人工审核结果。已经存在 `sent_message_id` 的记录禁止再次发送。

`sending` 必须带租约时间和稳定发送 UUID。进程崩溃后只能由租约恢复流程接管，并使用同一个 UUID 重试，不能生成新的发送请求标识。

## 7. 飞书资源结构

### 7.1 测试文档

```text
Codex飞书测试区/
  珍妮训练营测试知识库/
    第一期-Day01-测试课程
```

一期使用配置中的固定文档 URL，不进行云盘全局搜索。

### 7.2 测试 Base

Base 名称：`珍妮训练营 Agent 测试台`。

`消息与任务` 表：

- 标题、类型、状态、负责人、创建时间。
- `event_id`、`message_id`、会话 ID、学员 ID。
- 训练营期数、课程天数、问题类别、原始内容。
- AI 草稿、审核状态、审核人、审核时间、发送消息 ID。

`作业审核` 表：

- 学员姓名、学员 ID、训练营期数、课程天数。
- 作业内容、提交时间、初步点评。
- 审核状态、审核人、审核时间、来源消息 ID。

`运行日志` 表：

- 运行 ID、幂等键、操作类型、处理阶段和结果。
- 错误代码、脱敏错误摘要、重试次数。
- 开始时间和完成时间。

Base 用于人工查看和业务状态，不承担唯一约束。事务性防重由 `IdempotencyStore` 负责。

## 8. 事件与权限

一期最小事件：

- `im.message.receive_v1`：接收机器人私聊和群聊中 @ 机器人的消息。
- `card.action.trigger`：接收珍妮的批准和驳回操作。

当前 22 项用户身份 OAuth 权限足以完成指定文档读写和测试 Base 创建、读取、写入，但不构成机器人运行权限集合。机器人联调需要应用身份的最小消息权限，包括私聊只读、群聊 @ 消息只读以及应用身份发送或回复消息。

这些权限必须在实施前单独形成增量清单，经用户确认后配置。一期不申请读取群聊全部消息等敏感权限。

## 9. 幂等与失败处理

- 接收事件：`event_id` 唯一。
- 业务消息：`message_id` 唯一。
- 审批动作：卡片回调 `event_id` 唯一。
- Base 写入：业务记录 ID 与操作版本组成幂等键。
- 外发消息：审核记录 ID 与草稿版本组成发送键。
- 发送前必须同时满足 `status = approved`、无 `sent_message_id`、发送键未完成。
- 发送任务先以事务写入 `sending` 状态、租约时间和稳定 UUID，再调用飞书发送接口。
- 飞书接口支持请求 UUID 时，所有重试必须复用同一个 UUID；发送成功后持久化飞书消息 ID并把业务状态设为 `sent`。
- 发送结果不明确时不得直接新建发送任务，只能使用原 UUID 恢复或转人工处理。
- Base 写入超时后，先按来源 `message_id` 查询测试表；确认不存在后才能重试创建。
- 超时和临时网络错误可以有限重试；权限、参数和数据校验错误不自动重试。
- 失败日志不得包含 App Secret、访问令牌或完整凭证。

## 10. 安全规则

- App ID、App Secret、Token 和 AI API Key 只通过环境变量注入。
- `.env`、Markdown、Base 日志和控制台日志不得保存真实密钥。
- 审批回调必须验证操作者 open ID 与配置的珍妮审核人一致。
- 长连接事件必须由官方 SDK 校验，并检查应用、租户、事件类型和消息结构。
- 一期只接受文本消息；限制消息长度，拒绝未知消息类型和超限内容。
- 学员消息和课程文档均视为不可信输入，不得覆盖系统规则、审核要求或工具白名单。
- 审核卡片只携带记录 ID 和草稿版本；服务端必须重新读取当前记录，不能信任回传的正文、状态或接收人。
- 所有飞书写入先执行 dry-run 或展示资源、字段和记录计划。
- 一期只允许访问配置白名单中的测试文档、Base 和测试会话。
- 禁止通过模型输出动态决定飞书资源 token、权限范围或接收人。
- 学员接收人必须来自已验证的原始会话记录，运行日志只保存排障所需的最少个人信息。

## 11. 代码模块

```text
src/agent/
  worker.ts
  core/agent-service.ts
  events/message-handler.ts
  events/card-action-handler.ts
  intent/classifier.ts
  context/course-resolver.ts
  knowledge/retriever.ts
  homework/parser.ts
  review/workflow.ts
  idempotency/store.ts
  logging/run-log.ts
  feishu/docs-client.ts
  feishu/bitable-client.ts
  feishu/im-client.ts
```

模块通过小型接口隔离官方 SDK、AI Provider 和存储实现，不为二期功能预建额外抽象。

## 12. 验证标准

- 重放同一消息事件不会重复写 Base。
- 同一审批按钮重复点击不会重复发送。
- 非珍妮账号无法批准回复。
- 过期草稿版本和伪造卡片参数无法触发发送。
- 缺少训练营期数或课程天数时不会猜测。
- 未审核草稿不会对学员可见。
- 文档中的提示注入文本无法改变审核和资源白名单规则。
- 读取仅发生在白名单测试文档。
- Base 写入仅发生在白名单测试 Base。
- 临时发送失败可重试，成功后再次运行不会重发。
- 模拟发送成功后进程崩溃，恢复流程仍使用原发送 UUID。
- 日志中不存在真实密钥、Token 或 App Secret。

## 13. 二期边界

完成一期验收后，二期再单独设计和授权：正式课程知识库、正式学员名单、课程访问权限、高频问题、优秀作业、学员报喜、运营日报、异常告警和正式部署。二期不得通过放宽一期白名单直接启用。
