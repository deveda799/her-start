"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress, saveProgress, getCachedResult, setCachedResult, clearAnalysisResult } from "@/lib/her-start/use-progress";
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
  const { progress, update, loaded } = useProgress();
  const [line, setLine] = useState(0);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loaded) return;

    // 立即清除旧结果，防止闪现上一份报告
    clearAnalysisResult();
    update({ result: null, mode: null, analysisId: null, demoReason: null });

    if (!progress.answers.every((a) => a.trim().length > 0)) {
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
      const fresh = saveProgress({});
      const answers = fresh.answers;
      const followupQuestion = fresh.followupQuestion;
      const followupAnswer = fresh.followupAnswer;

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

      if (followupQuestion && followupAnswer) {
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

        // 如果请求被中止（用户已离开页面），不处理响应
        if (controller.signal.aborted) return;

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
          router.push("/result");
          return;
        }

        throw new Error("UNKNOWN_STATUS");
      } catch (err) {
        if (controller.signal.aborted) return;

        const isAbort = err instanceof Error && err.name === "AbortError";
        const reason = isAbort
          ? "AI 分析超时，已为你展示演示结果。你可以稍后重试。"
          : "Value Mirror 暂时没有完成分析。已为你展示演示结果，你可以重新尝试。";

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
    window.location.reload();
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
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={retry}>重新尝试</button>
            <button className="btn btn-secondary" onClick={viewDemo}>查看演示结果</button>
          </div>
        </div>
      )}
    </div>
  );
}
