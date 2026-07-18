"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress, saveProgress } from "@/lib/her-start/use-progress";
import { demoAnalysis } from "@/lib/her-start/demo";
import type { HerStartAnalysis } from "@/lib/her-start/schema";

const LOADING_LINES = [
  "正在整理你走过的路……",
  "正在寻找那些被你低估的能力……",
  "正在把经历重新组织为人生资产……",
  "正在生成你的第一个最小产品……",
];

type AnalyzeResponse =
  | { status: "complete"; result: HerStartAnalysis; demo?: boolean; message?: string }
  | { status: "needs_followup"; followup: { question: string; missingReason: string }; demo?: boolean };

type PageState = "loading" | "error" | "redirecting";

export default function AnalyzingPage() {
  const router = useRouter();
  const { progress, update, loaded } = useProgress();
  const [line, setLine] = useState(0);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // 只在 loaded 后执行一次分析
  useEffect(() => {
    if (!loaded) return;

    // 校验：四问必须全部有内容
    if (!progress.answers.every((a) => a.trim().length > 0)) {
      router.push("/interview");
      return;
    }

    const timer = setInterval(() => setLine((l) => (l + 1) % 4), 2000);
    void doAnalyze();

    return () => clearInterval(timer);

    async function doAnalyze() {
      // 读取最新的 localStorage（避免 closure capture 问题）
      const fresh = saveProgress({});
      const answers = fresh.answers;
      const followupQuestion = fresh.followupQuestion;
      const followupAnswer = fresh.followupAnswer;

      const body: Record<string, unknown> = {
        answers,
        requestId: crypto.randomUUID(),
      };

      // 如果已有追问和回答，带上 followupUsed=true
      if (followupQuestion && followupAnswer) {
        body.followup = {
          question: followupQuestion,
          answer: followupAnswer,
        };
        body.followupUsed = true;
      }

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

        if (!res.ok) {
          throw new Error(`HTTP_${res.status}`);
        }
        const data = (await res.json()) as AnalyzeResponse;

        if (data.status === "needs_followup" && !body.followupUsed) {
          // 需要追问，保存追问问题，跳回聊天页
          saveProgress({ followupQuestion: data.followup.question });
          setPageState("redirecting");
          router.push("/interview?followup=1");
          return;
        }

        if (data.status === "complete") {
          saveProgress({
            result: data.result,
            isDemo: Boolean(data.demo),
            points: 100,
            createdAt: new Date().toISOString(),
          });
          if (data.message) {
            // 限流提示，但仍展示结果
          }
          setPageState("redirecting");
          router.push("/result");
          return;
        }

        throw new Error("UNKNOWN_STATUS");
      } catch (err) {
        // 失败兜底：使用演示数据
        const isAbort = err instanceof Error && err.name === "AbortError";
        const reason = isAbort
          ? "AI 分析超时，已为你展示演示结果。你可以稍后重试。"
          : "Value Mirror 暂时没有完成分析。已为你展示演示结果，你可以重新尝试。";

        saveProgress({
          result: demoAnalysis,
          isDemo: true,
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
    setPageState("loading");
    setErrorMsg("");
    // 重新触发分析
    window.location.reload();
  }

  function viewDemo() {
    saveProgress({
      result: demoAnalysis,
      isDemo: true,
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
