import { analysisSchema, type HerStartAnalysis } from "./schema";

const SYSTEM_PROMPT = `你是Value Mirror价值镜。基于用户四个回答，只推荐一条低成本主商业路径。区分事实、分析与待验证假设，不承诺收入，不虚构数据；价格写作“建议测试价格”。输出严格JSON，三张卡总计不超过1500字。assets正好3项，actions最多3项、每项不超过30分钟且至少一项接触真实用户。closing使用指定固定结语。`;

export async function analyzeWithProvider(answers: string[]): Promise<HerStartAnalysis> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) throw new Error("AI_NOT_CONFIGURED");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.3, response_format: { type: "json_object" }, messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: answers.map((answer, i) => `回答${i + 1}：${answer}`).join("\n") },
      ] }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("AI_REQUEST_FAILED");
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return analysisSchema.parse(JSON.parse(payload.choices?.[0]?.message?.content ?? ""));
  } finally { clearTimeout(timer); }
}
