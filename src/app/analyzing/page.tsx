"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress } from "@/lib/her-start/use-progress";
import { demoAnalysis } from "@/lib/her-start/demo";
import type { HerStartAnalysis } from "@/lib/her-start/schema";

const LOADING_LINES = [
  "正在整理你走过的路……",
  "正在寻找那些被你低估的能力……",
  "正在把经历重新组织为人生资产……",
  "正在生成你的第一个最小产品……",
];

type AnalyzeResponse =
  | { status: "complete"; result: HerStartAnalysis; demo?: boolean }
  | { status: "needs_followup"; followup: { question: string; missingReason: string }; demo?: boolean };

export default function AnalyzingPage() {
  const router = useRouter();
  const { progress, update } = useProgress();
  const [line, setLine] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!progress.answers.every((a) => a.trim().length > 0)) {
      router.push("/interview");
      return;
    }

    const timer = setInterval(() => setLine((l) => (l + 1) % 4), 2000);
    void doAnalyze();

    return () => clearInterval(timer);

    async function doAnalyze() {
      // 已有 followup 问句但用户还没回答，不重复请求
      if (progress.followupQuestion && !progress.followupAnswer) {
        router.push("/interview?followup=1");
        return;
      }

      const body: Record<string, unknown> = {
        answers: progress.answers,
        requestId: crypto.randomUUID(),
      };

      // 如果已有追问和回答，带上 followupUsed=true
      if (progress.followupQuestion && progress.followupAnswer) {
        body.followup = {
          question: progress.followupQuestion,
          answer: progress.followupAnswer,
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

        if (!res.ok) throw new Error("分析请求失败");
        const data = (await res.json()) as AnalyzeResponse;

        if (data.status === "needs_followup" && !body.followupUsed) {
          // 需要追问，保存追问问题，跳回聊天页
          update({
            followupQuestion: data.followup.question,
          });
          router.push("/interview?followup=1");
          return;
        }

        if (data.status === "complete") {
          update({
            result: data.result,
            isDemo: Boolean(data.demo),
            points: 100,
            createdAt: new Date().toISOString(),
          });
          router.push("/result");
          return;
        }

        throw new Error("分析返回格式异常");
      } catch {
        // 失败兜底：使用演示数据
        update({
          result: demoAnalysis,
          isDemo: true,
          points: 100,
          createdAt: new Date().toISOString(),
        });
        setError("AI 分析暂时不可用，已为你展示演示结果。你可以稍后重试。");
        setTimeout(() => router.push("/result"), 2000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="loading-page">
      <div className="loading-ring" aria-hidden="true" />
      <div className="loading-kicker">VALUE MIRROR · 价值镜</div>
      <h1 className="loading-title">价值镜正在为你梳理</h1>
      <p className="loading-line" aria-live="polite">{LOADING_LINES[line]}</p>
      <div className="loading-bar"><span /></div>
      <p className="loading-note">这通常需要 10—30 秒，请不要关闭页面</p>
      {error && (
        <div className="loading-error" role="alert">{error}</div>
      )}
    </div>
  );
}
