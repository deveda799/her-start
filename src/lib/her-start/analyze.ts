import { analysisSchema, followupSchema, type HerStartAnalysis, type FollowupQuestion } from "./schema";

const SYSTEM_PROMPT = `你是Value Mirror价值镜，兼具人生资产顾问、优势发现专家、商业顾问和AI商业教练。

基于用户四个回答，识别：
- 工作和行业经验、项目和管理经验
- 家庭和育儿经历、学习和知识积累
- 兴趣与长期研究、专业技能和工具技能
- 稳定优势、别人的认可和信任
- 人脉资源和圈层、内容和作品

必须遵守：
1. 判断基于用户回答，重要判断引用用户事实
2. 区分【事实】【分析】【待验证假设】
3. 不空泛夸奖、不虚构市场数据、不保证收入
4. 不把推测描述成已验证
5. 价格称为"建议测试价格"
6. 只推荐1条主商业路径，最多2条简短备选
7. 不制定长期创业计划、不推荐大量AI工具
8. 三张卡总内容不超过1500字
9. 语气真实、温暖、理性、专业

输出严格JSON。closing使用指定固定结语：
"你不是缺少价值，而是还没有把自己的人生资产重新组织成别人愿意购买的价值。今天，我们完成了第一步。"

assets正好3项，actions最多3项、每项不超过30分钟且至少一项接触真实用户。

请以JSON格式输出，必须包含所有字段，不可省略：
{"facts":["事实"],"lifeAssetCard":{"assets":[{"name":"人生资产名称","source":"资产来自什么经历","formedAbility":"形成的能力","transferableValue":"可迁移场景","factEvidence":"用户事实依据"}],"coreTransferableAbility":"核心可迁移能力","valuePositioning":"一句话价值定位"},"minimumProductCard":{"primaryPath":"唯一主路径","alternativePaths":["备选一"],"targetUser":"目标用户","problem":"解决的问题","productName":"最小产品名称","delivery":"交付方式","testPrice":"建议测试价格","paymentReason":"可能愿意付费的理由","firstCustomers":"第一批潜在用户","validationNote":"需要真实验证的假设"},"actionCard":{"actions":[{"task":"行动","estimatedMinutes":30,"completionCriteria":"完成标准","realUserContact":true}],"badge":"开局行动者"},"assumptions":["需要验证的推测"],"closing":"你不是缺少价值，而是还没有把自己的人生资产重新组织成别人愿意购买的价值。今天，我们完成了第一步。"}
`;

const FOLLOWUP_PROMPT = `你是Value Mirror价值镜。现在需要判断用户四问信息是否足以生成商业化方案。

只有出现以下情况之一，且影响最小产品推荐时，才追问：
1. 回答过于笼统，缺少真实经历
2. 无法判断她真实解决过什么问题
3. 无法判断别人为什么信任她
4. 无法找到可复用、可迁移的能力
5. 无法判断目标用户
6. 无法判断用户愿意采用的交付方式
7. 用户方向与现实时间条件明显矛盾
8. 无法形成唯一主商业路径

不得追问的情况：
1. 只是为了让报告更丰富
2. 缺少不影响判断的信息
3. 已有真实案例支持能力判断
4. 已能形成低成本最小产品
5. 缺少手机号、城市、年龄等非必要信息
6. 只是想继续泛泛探索
7. AI只是想确认自己的推测

如果信息充分，返回 {"status":"complete"}。
如果必须追问，返回 {"status":"needs_followup","followup":{"question":"唯一动态追问","missingReason":"缺少的关键信息"}}。

追问要求：
- 基于用户刚刚提供的具体内容
- 一次只问一个问题，不包含多个并列问题
- 尽量要求真实案例
- 不超过80个汉字
- 温暖、自然、专业
- 不重复固定四问
- 不索取敏感信息
- 不直接暗示答案
- 不承诺收入

请以JSON格式输出结果。`;

const FINALIZE_PROMPT = `你是Value Mirror价值镜。用户已回答了动态追问。现在必须生成最终方案，不允许继续追问。

${SYSTEM_PROMPT}`;

export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  usageUnavailable?: boolean;
};

export type AnalyzeResult =
  | { status: "complete"; result: HerStartAnalysis; usage: TokenUsage }
  | { status: "needs_followup"; followup: FollowupQuestion; usage: TokenUsage };

type AIConfig = { apiKey: string; baseUrl: string; model: string };

export async function analyzeWithProvider(
  answers: string[],
  options?: { followupUsed?: boolean; followupQ?: string; followupA?: string }
): Promise<AnalyzeResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) throw new Error("AI_NOT_CONFIGURED");
  const cfg: AIConfig = { apiKey, baseUrl, model };

  const followupUsed = options?.followupUsed ?? false;

  // 第二次调用：必须返回 complete
  if (followupUsed && options?.followupQ && options?.followupA) {
    const { result, usage } = await callAI(cfg, FINALIZE_PROMPT, analysisSchema, [
      { role: "system", content: FINALIZE_PROMPT },
      { role: "user", content: buildFinalizeInput(answers, options.followupQ, options.followupA) },
    ]);
    return { status: "complete", result, usage };
  }

  // 第一次调用：先判断是否需要追问
  const { followup, usage: followupUsage } = await checkNeedsFollowup(cfg, answers);
  if (followup) {
    return { status: "needs_followup", followup, usage: followupUsage };
  }

  // 信息充分，直接生成
  const { result, usage } = await callAI(cfg, SYSTEM_PROMPT, analysisSchema, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: answers.map((a, i) => `回答${i + 1}：${a}`).join("\n") },
  ]);
  return { status: "complete", result, usage };
}

function extractUsage(payload: unknown): TokenUsage {
  const obj = payload as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
  if (obj?.usage) {
    return {
      promptTokens: obj.usage.prompt_tokens,
      completionTokens: obj.usage.completion_tokens,
      totalTokens: obj.usage.total_tokens,
    };
  }
  return { usageUnavailable: true };
}

async function checkNeedsFollowup(cfg: AIConfig, answers: string[]): Promise<{ followup: FollowupQuestion | null; usage: TokenUsage }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const body: Record<string, unknown> = {
      model: cfg.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      messages: [
        { role: "system", content: FOLLOWUP_PROMPT },
        { role: "user", content: answers.map((a, i) => `回答${i + 1}：${a}`).join("\n") },
      ],
    };
    const response = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) { const eb = await response.text().catch(() => "?"); console.info(JSON.stringify({ aiError: "FOLLOWUP", httpStatus: response.status, body: eb.slice(0, 300) })); throw new Error("AI_FOLLOWUP_FAILED"); }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as { status?: string; followup?: unknown };
    const usage = extractUsage(payload);
    if (parsed.status === "needs_followup" && parsed.followup) {
      return { followup: followupSchema.parse(parsed.followup), usage };
    }
    return { followup: null, usage };
  } finally {
    clearTimeout(timer);
  }
}

async function callAI(
  cfg: AIConfig,
  _prompt: string,
  schema: typeof analysisSchema,
  messages: Array<{ role: string; content: string }>
): Promise<{ result: HerStartAnalysis; usage: TokenUsage }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const body: Record<string, unknown> = {
      model: cfg.model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      messages,
    };
    const response = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("AI_REQUEST_FAILED");
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const result = schema.parse(JSON.parse(payload.choices?.[0]?.message?.content ?? ""));
    const usage = extractUsage(payload);
    return { result, usage };
  } finally {
    clearTimeout(timer);
  }
}

function buildFinalizeInput(answers: string[], q: string, a: string): string {
  return [
    ...answers.map((answer, i) => `回答${i + 1}：${answer}`),
    `动态追问：${q}`,
    `追问回答：${a}`,
  ].join("\n");
}
