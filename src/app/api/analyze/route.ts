import { NextRequest, NextResponse } from "next/server";
import { analyzeWithProvider } from "@/lib/her-start/analyze";
import { demoAnalysis } from "@/lib/her-start/demo";
import { interviewSchema } from "@/lib/her-start/schema";

const ipCalls = new Map<string, number[]>();
let daily = { day: new Date().toISOString().slice(0, 10), count: 0 };

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const input = interviewSchema.parse(await request.json());
    const now = Date.now();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const calls = (ipCalls.get(ip) ?? []).filter((time) => now - time < 3_600_000);
    const today = new Date().toISOString().slice(0, 10);
    if (daily.day !== today) daily = { day: today, count: 0 };
    const ipLimit = Number(process.env.IP_HOURLY_AI_LIMIT || 10);
    const dailyLimit = Number(process.env.GLOBAL_DAILY_AI_LIMIT || 300);
    if (calls.length >= ipLimit || daily.count >= dailyLimit) {
      return NextResponse.json({ result: demoAnalysis, demo: true, message: "今天体验的人有点多，已为你展示演示结果。" });
    }
    try {
      const result = await analyzeWithProvider(input.answers);
      calls.push(now); ipCalls.set(ip, calls); daily.count += 1;
      console.info(JSON.stringify({ requestId, success: true, durationMs: Date.now() - now, dailyCalls: daily.count }));
      return NextResponse.json({ result, demo: false });
    } catch {
      console.info(JSON.stringify({ requestId, success: false, durationMs: Date.now() - now, fallback: true }));
      return NextResponse.json({ result: demoAnalysis, demo: true });
    }
  } catch {
    return NextResponse.json({ message: "提交内容不完整，请检查四个回答后重试。" }, { status: 400 });
  }
}
