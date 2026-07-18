import { NextRequest, NextResponse } from "next/server";
import { analyzeWithProvider } from "@/lib/her-start/analyze";
import { demoAnalysis, demoFollowup } from "@/lib/her-start/demo";
import { interviewSchema } from "@/lib/her-start/schema";
import { checkRateLimit, recordCall } from "@/lib/her-start/rate-limit";

type DemoReason = "missing_config" | "provider_error" | "timeout" | "schema_invalid" | "rate_limit" | "global_limit";

function makeAnalysisId(): string {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const analysisId = makeAnalysisId();
  try {
    const input = interviewSchema.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const ipLimit = Number(process.env.IP_HOURLY_AI_LIMIT || 10);
    const dailyLimit = Number(process.env.GLOBAL_DAILY_AI_LIMIT || 300);

    // 限流检查
    if (!checkRateLimit(ip, ipLimit, dailyLimit)) {
      return NextResponse.json({
        status: "complete",
        mode: "demo" as const,
        personalized: false,
        demoReason: "rate_limit" as DemoReason,
        analysisId,
        result: demoAnalysis,
        message: "今天体验的人有点多，已为你展示演示结果。",
      });
    }

    recordCall(ip);
    const now = Date.now();
    const model = process.env.AI_MODEL || "unknown";

    try {
      const result = await analyzeWithProvider(input.answers, {
        followupUsed: Boolean(input.followupUsed),
        followupQ: input.followup?.question,
        followupA: input.followup?.answer,
      });

      console.info(JSON.stringify({
        requestId,
        analysisId,
        success: true,
        durationMs: Date.now() - now,
        followupUsed: Boolean(input.followupUsed),
        status: result.status,
        mode: "ai",
        model,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        usageUnavailable: result.usage.usageUnavailable ?? false,
      }));

      if (result.status === "needs_followup") {
        return NextResponse.json({
          status: "needs_followup",
          followup: result.followup,
          mode: "ai" as const,
          personalized: true,
          analysisId,
        });
      }

      return NextResponse.json({
        status: "complete",
        result: result.result,
        mode: "ai" as const,
        personalized: true,
        analysisId,
      });
    } catch (err) {
      const errorName = err instanceof Error ? err.name : String(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTimeout = errorName === "AbortError";
      const isMissingConfig = errMsg === "AI_NOT_CONFIGURED" || errMsg.includes("NOT_CONFIGURED");

      let demoReason: DemoReason;
      if (isMissingConfig) demoReason = "missing_config";
      else if (isTimeout) demoReason = "timeout";
      else if (errMsg.includes("SCHEMA") || errMsg.includes("Zod")) demoReason = "schema_invalid";
      else demoReason = "provider_error";

      console.info(JSON.stringify({
        requestId,
        analysisId,
        success: false,
        durationMs: Date.now() - now,
        fallback: true,
        mode: "demo",
        demoReason,
        errorName: errMsg,
        model,
      }));

      // 演示模式：直接返回完整演示结果，不再返回与用户回答矛盾的固定追问
      // 第一次和第二次请求都直接返回 demoAnalysis
      return NextResponse.json({
        status: "complete",
        mode: "demo" as const,
        personalized: false,
        demoReason,
        analysisId,
        result: demoAnalysis,
        demo: true,
      });
    }
  } catch {
    return NextResponse.json(
      { status: "error", message: "提交内容不完整，请检查四个回答后重试。" },
      { status: 400 }
    );
  }
}
