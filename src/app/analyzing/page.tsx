"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress, saveProgress, loadProgress, getCachedResult, setCachedResult, clearAnalysisResult } from "@/lib/her-start/use-progress";
import { demoAnalysis } from "@/lib/her-start/demo";
import type { HerStartAnalysis } from "@/lib/her-start/schema";

const LOADING_LINES = [
  "正在整理你走过的路……",
  "正在寻找那些被你低估的能力……",
  "正在把经历重新组织为人生资产……",
  "正在生成你的第一个最小产品……",
];

type AnalyzeResponse = {
  status: "complete" | "needs_followup";
  result?: HerStartAnalysis;
  followup?: { question: string; missingReason: string };
  mode?: "ai" | "demo";
  personalized?: boolean;
  demoReason?: string;
  analysisId?: string;
  message?: string;
  demo?: boolean;
};

type PageState = "loading" | "error";

export default function AnalyzingPage() {
  const router = useRouter();
  const { loaded } = useProgress();
  const [line, setLine] = useState(0);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!loaded || startedRef.current) return;
    startedRef.current = true;

    // 直接从 localStorage 读取最新数据，不依赖 React state 闭包
    const fresh = loadProgress();

    // 立即清除旧结果，防止闪现上一份报告
    clearAnalysisResult();

    // 必须检查四问是否完整——如果空才跳回 interview
    if (!fresh.answers.every((a) => a.trim().length > 0)) {
      router.push("/interview");
      return;
    }

    const timer = setInterval(() => setLine((l) => (l + 1) % 4), 2000);
    const controller = new AbortController();
    abortRef.current = controller;

    void doAnalyze();

    return () => {
      clearInterval(timer);
      controller.abort();
    };

    async function doAnalyze() {
      // 再次从 localStorage 读取，确保最新
      const current = loadProgress();
      const answers = current.answers;
      const followupQuestion = current.followupQuestion;
      const followupAnswer = current.followupAnswer;

      // 检查本地缓存（仅 AI 个性化结果）
      const cached = getCachedResult(answers, followupQuestion ?? undefined, followupAnswer ?? undefined);
      if (cached) {
        saveProgress({
          result: cached,
          isDemo: false,
          mode: "ai",
          personalized: true,
          points: 100,
          createdAt: new Date().toISOString(),
        });
        router.push("/result");
        return;
      }

      const body: Record<string, unknown> = {
        answers,
        requestId: crypto.randomUUID(),
      };

      // 如果有追问和回答，带上 followupUsed=true
      if (followupQuestion && followupAnswer && followupAnswer.trim().length > 0) {
        body.followup = { question: followupQuestion, answer: followupAnswer };
        body.followupUsed = true;
      }

      try {
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

        if (controller.signal.aborted) return;

        // followupUsed=true 时，即使 AI 意外返回 needs_followup 也不跳回 interview
        if (data.status === "needs_followup" && !body.followupUsed) {
          saveProgress({ followupQuestion: data.followup?.question });
          router.push("/interview?followup=1");
          return;
        }

        if (data.status === "complete" && data.result) {
          // 仅缓存 AI 个性化结果，不缓存演示结果
          if (data.mode === "ai" && data.personalized) {
            setCachedResult(answers, data.result, followupQuestion ?? undefined, followupAnswer ?? undefined);
          }

          // 先写入 localStorage，确认保存后再跳转
          saveProgress({
            result: data.result,
            isDemo: data.mode === "demo",
            mode: data.mode ?? "demo",
            personalized: data.personalized ?? false,
            analysisId: data.analysisId ?? null,
            demoReason: data.demoReason ?? null,
            points: 100,
            createdAt: new Date().toISOString(),
          });

          // 验证写入成功
          const verify = loadProgress();
          if (!verify.result) {
            throw new Error("SAVE_FAILED");
          }

          router.push("/result");
          return;
        }

        // followupUsed=true 但返回 needs_followup：不允许跳回 interview
        if (data.status === "needs_followup" && body.followupUsed) {
          throw new Error("AI_RETURNED_FOLLOWUP_AFTER_FOLLOWUPUSED");
        }

        throw new Error("UNKNOWN_STATUS");
      } catch (err) {
        if (controller.signal.aborted) return;

        const isAbort = err instanceof Error && err.name === "AbortError";
        const reason = isAbort
          ? "AI 分析超时，你的回答已经保存。可以重新尝试。"
          : "Value Mirror 暂时没有完成分析，你的回答已经保存。可以重新尝试，或查看演示结果。";

        saveProgress({
          result: demoAnalysis,
          isDemo: true,
          mode: "demo",
          personalized: false,
          demoReason: isAbort ? "timeout" : "provider_error",
          points: 100,
          createdAt: new Date().toISOString(),
        });
        setErrorMsg(reason);
        setPageState("error");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function retry() {
    abortRef.current?.abort();
    clearAnalysisResult();
    setPageState("loading");
    setErrorMsg("");
    startedRef.current = false;
    // 重新触发 effect
    setTimeout(() => window.location.reload(), 100);
  }

  function viewDemo() {
    saveProgress({
      result: demoAnalysis,
      isDemo: true,
      mode: "demo",
      personalized: false,
      demoReason: "provider_error",
      points: 100,
      createdAt: new Date().toISOString(),
    });
    router.push("/result");
  }

  return (
    <div className="loading-page">
      <div className="loading-ring" aria-hidden="true" />
      <div className="loading-kicker">VALUE MIRROR · 价值镜</div>
      <h1 className="loading-title">价值镜正在为你梳理</h1>
      <p className="loading-line" aria-live="polite">{LOADING_LINES[line]}</p>
      <div className="loading-bar"><span /></div>
      <p className="loading-note">这通常需要 10—30 秒，请不要关闭页面</p>
      {pageState === "error" && (
        <div className="loading-error" role="alert">
          {errorMsg}
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={retry}>重新生成</button>
            <button className="btn btn-secondary" onClick={() => router.push("/interview")}>返回修改</button>
            <button className="btn btn-ghost" onClick={viewDemo}>查看演示结果</button>
          </div>
        </div>
      )}
    </div>
  );
}
