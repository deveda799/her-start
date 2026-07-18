import { NextRequest, NextResponse } from "next/server";
import { analyzeWithProvider } from "@/lib/her-start/analyze";
import { demoAnalysis, demoFollowup } from "@/lib/her-start/demo";
import { interviewSchema } from "@/lib/her-start/schema";
import { checkRateLimit, recordCall } from "@/lib/her-start/rate-limit";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const input = interviewSchema.parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const ipLimit = Number(process.env.IP_HOURLY_AI_LIMIT || 10);
    const dailyLimit = Number(process.env.GLOBAL_DAILY_AI_LIMIT || 300);

    // 限流检查：达到上限直接返回演示结果
    if (!checkRateLimit(ip, ipLimit, dailyLimit)) {
      return NextResponse.json({
        status: "complete",
        result: demoAnalysis,
        demo: true,
        message: "今天体验的人有点多，已为你展示演示结果。",
      });
    }

    // 通过限流后立即计数（无论后续 AI 调用成功或失败都算一次）
    recordCall(ip);

    const now = Date.now();
    try {
      const result = await analyzeWithProvider(input.answers, {
        followupUsed: Boolean(input.followupUsed),
        followupQ: input.followup?.question,
        followupA: input.followup?.answer,
      });

      console.info(JSON.stringify({
        requestId,
        success: true,
        durationMs: Date.now() - now,
        followupUsed: Boolean(input.followupUsed),
        status: result.status,
      }));

      return NextResponse.json(result);
    } catch (err) {
      // AI 异常：演示模式兜底
      const errorName = err instanceof Error ? err.name : String(err);
      console.info(JSON.stringify({
        requestId,
        success: false,
        durationMs: Date.now() - now,
        fallback: true,
        errorName,
      }));

      if (input.followupUsed) {
        return NextResponse.json({
          status: "complete",
          result: demoAnalysis,
          demo: true,
        });
      }

      return NextResponse.json({
        status: "needs_followup",
        followup: demoFollowup,
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
