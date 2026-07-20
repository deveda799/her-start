import type { HerStartAnalysis } from "@/lib/her-start/schema";
import { loadProgress, saveProgress, clearAnalysisResult, getCachedResult, setCachedResult, makeShortAnalysisId, type ProgressData, type DemoReason } from "@/lib/her-start/use-progress";
import { demoAnalysis } from "@/lib/her-start/demo";

export type AnalysisState =
  | { phase: "idle" }
  | { phase: "loading"; analysisId: string; elapsed: number }
  | { phase: "needs_followup"; analysisId: string; question: string }
  | { phase: "success"; analysisId: string; result: HerStartAnalysis; mode: "ai" | "demo"; personalized: boolean }
  | { phase: "error"; analysisId: string; reason: string; demoReason: DemoReason };

type AnalyzeResponse = {
  status: "complete" | "needs_followup";
  result?: HerStartAnalysis;
  followup?: { question: string; missingReason: string };
  mode?: "ai" | "demo";
  personalized?: boolean;
  demoReason?: string;
  analysisId?: string;
  message?: string;
};

/**
 * 统一分析编排器 — 所有 AI 调用逻辑集中在此。
 * 页面只负责调用此函数和展示状态。
 */
export async function runAnalysis(opts?: { skipFollowup?: boolean }): Promise<AnalysisState> {
  // 1. 从 localStorage 读取最新数据（不依赖 React state）
  const current = loadProgress();

  // 2. 清除旧结果
  clearAnalysisResult();

  // 3. 校验四问完整
  if (!current.answers.every((a) => a.trim().length > 0)) {
    return { phase: "idle" };
  }

  const analysisId = makeShortAnalysisId();

  // 4. 检查本地缓存（仅 AI 个性化结果）
  if (!current.followupUsed) {
    const cached = getCachedResult(current.answers);
    if (cached) {
      saveProgress({
        result: cached,
        isDemo: false,
        mode: "ai",
        personalized: true,
        analysisId,
        points: 100,
        createdAt: new Date().toISOString(),
      });
      return { phase: "success", analysisId, result: cached, mode: "ai", personalized: true };
    }
  }

  // 5. 构造请求
  // crypto.randomUUID 在非 HTTPS 环境下不可用，需要 fallback
  const safeUUID = (): string => {
    try {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
    } catch { /* fall through */ }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const body: Record<string, unknown> = {
    answers: current.answers,
    requestId: safeUUID(),
  };

  // 如果有追问和回答，带上 followupUsed=true
  // 或者用户选择跳过追问
  if (current.followupQuestion && current.followupAnswer && current.followupAnswer.trim().length > 0) {
    body.followup = { question: current.followupQuestion, answer: current.followupAnswer };
    body.followupUsed = true;
  } else if (opts?.skipFollowup) {
    // 跳过追问，直接基于四问生成
    body.followupUsed = false;
  } else if (current.followupQuestion && !current.followupAnswer) {
    // 有追问但没回答，跳过追问直接生成
    body.followupUsed = false;
    saveProgress({ followupAnswer: null, followupUsed: false });
  }

  // 6. 发送请求
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    const data = (await res.json()) as AnalyzeResponse;

    // 7. 处理 needs_followup（仅第一次请求）
    if (data.status === "needs_followup" && !body.followupUsed) {
      saveProgress({ followupQuestion: data.followup?.question ?? null });
      return {
        phase: "needs_followup",
        analysisId: data.analysisId ?? analysisId,
        question: data.followup?.question ?? "",
      };
    }

    // 8. followupUsed=true 但 AI 仍返回 needs_followup — 不允许循环
    if (data.status === "needs_followup" && body.followupUsed) {
      // 强制使用演示结果兜底
      saveProgress({
        result: demoAnalysis,
        isDemo: true,
        mode: "demo",
        personalized: false,
        demoReason: "provider_error",
        analysisId,
        points: 100,
        createdAt: new Date().toISOString(),
      });
      return { phase: "success", analysisId, result: demoAnalysis, mode: "demo", personalized: false };
    }

    // 9. 成功 — 保存结果到 localStorage
    if (data.status === "complete" && data.result) {
      // 仅缓存 AI 个性化结果
      if (data.mode === "ai" && data.personalized) {
        setCachedResult(current.answers, data.result, current.followupQuestion ?? undefined, current.followupAnswer ?? undefined);
      }

      const next = saveProgress({
        result: data.result,
        isDemo: data.mode === "demo",
        mode: data.mode ?? "demo",
        personalized: data.personalized ?? false,
        analysisId: data.analysisId ?? analysisId,
        demoReason: (data.demoReason as DemoReason) ?? null,
        points: 100,
        createdAt: new Date().toISOString(),
      });

      // 10. 验证保存成功
      if (!next.result) {
        throw new Error("SAVE_FAILED");
      }

      return {
        phase: "success",
        analysisId: data.analysisId ?? analysisId,
        result: data.result,
        mode: (data.mode ?? "demo") as "ai" | "demo",
        personalized: data.personalized ?? false,
      };
    }

    throw new Error("UNKNOWN_STATUS");
  } catch (err) {
    // 11. 失败兜底 — 永远返回结果（最坏情况是演示报告）
    const isAbort = err instanceof Error && err.name === "AbortError";
    const demoReason: DemoReason = isAbort ? "timeout" : "provider_error";
    const reason = isAbort
      ? "AI 分析超时，你的回答已经保存。可以重新尝试或查看演示结果。"
      : "Value Mirror 暂时没有完成分析，你的回答已经保存。";

    saveProgress({
      result: demoAnalysis,
      isDemo: true,
      mode: "demo",
      personalized: false,
      demoReason,
      analysisId,
      points: 100,
      createdAt: new Date().toISOString(),
    });

    return { phase: "error", analysisId, reason, demoReason };
  }
}

/** 跳过追问，直接基于四问生成 */
export async function runAnalysisSkipFollowup(): Promise<AnalysisState> {
  saveProgress({ followupAnswer: null, followupUsed: false });
  return runAnalysis({ skipFollowup: true });
}

/** 从演示结果进入结果页 */
export function enterDemoResult(): AnalysisState {
  const analysisId = makeShortAnalysisId();
  saveProgress({
    result: demoAnalysis,
    isDemo: true,
    mode: "demo",
    personalized: false,
    demoReason: "provider_error",
    analysisId,
    points: 100,
    createdAt: new Date().toISOString(),
  });
  return { phase: "success", analysisId, result: demoAnalysis, mode: "demo", personalized: false };
}
