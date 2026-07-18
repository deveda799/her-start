"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgress, loadProgress, BUILD_VERSION } from "@/lib/her-start/use-progress";
import { runAnalysis, enterDemoResult, type AnalysisState } from "@/lib/her-start/orchestrator";

const LOADING_LINES = [
  "正在整理你走过的路……",
  "正在寻找那些被你低估的能力……",
  "正在把经历重新组织为人生资产……",
  "正在生成你的第一个最小产品……",
];

type PageState = "loading" | "error" | "redirecting";

export default function AnalyzingPage() {
  const router = useRouter();
  const { loaded } = useProgress();
  const [line, setLine] = useState(0);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisId, setAnalysisId] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);
  const startTimeRef = useRef(0);

  // 轮播文案
  useEffect(() => {
    const timer = setInterval(() => setLine((l) => (l + 1) % 4), 2000);
    return () => clearInterval(timer);
  }, []);

  // 计时
  useEffect(() => {
    startTimeRef.current = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  // 核心分析逻辑 — 只在 loaded 后执行一次
  useEffect(() => {
    if (!loaded || startedRef.current) return;
    startedRef.current = true;

    // 直接从 localStorage 读取，不依赖 React state 闭包
    const fresh = loadProgress();

    // 四问不完整才跳回 interview
    if (!fresh.answers.every((a) => a.trim().length > 0)) {
      router.push("/interview");
      return;
    }

    void doRunAnalysis();

    async function doRunAnalysis() {
      const state: AnalysisState = await runAnalysis();

      switch (state.phase) {
        case "idle":
          // 四问不完整
          router.push("/interview");
          break;

        case "needs_followup":
          setAnalysisId(state.analysisId);
          // 跳到追问页
          setTimeout(() => router.push("/interview?followup=1"), 300);
          break;

        case "success":
          setAnalysisId(state.analysisId);
          setPageState("redirecting");
          // 验证 result 已写入 localStorage
          const verify = loadProgress();
          if (!verify.result) {
            // 保存失败，用演示兜底
            enterDemoResult();
          }
          setTimeout(() => router.push("/result"), 300);
          break;

        case "error":
          setAnalysisId(state.analysisId);
          setErrorMsg(state.reason);
          setPageState("error");
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function retry() {
    startedRef.current = false;
    setPageState("loading");
    setErrorMsg("");
    setElapsed(0);
    startTimeRef.current = Date.now();
    // 重新触发
    setTimeout(() => window.location.reload(), 100);
  }

  function viewDemo() {
    enterDemoResult();
    router.push("/result");
  }

  function goBack() {
    router.push("/interview");
  }

  const showSlowHint = elapsed >= 15;
  const showTimeoutHint = elapsed >= 30;

  return (
    <div className="loading-page">
      <div className="loading-ring" aria-hidden="true" />
      <div className="loading-kicker">VALUE MIRROR · 价值镜</div>
      <h1 className="loading-title">价值镜正在为你梳理</h1>
      <p className="loading-line" aria-live="polite">{LOADING_LINES[line]}</p>
      <div className="loading-bar"><span /></div>

      {analysisId && (
        <p className="loading-note">分析编号：{analysisId}</p>
      )}

      {showSlowHint && !showTimeoutHint && pageState === "loading" && (
        <p className="loading-note" style={{ color: "var(--gold)" }}>AI 正在认真分析，请稍候……</p>
      )}

      {showTimeoutHint && pageState === "loading" && (
        <div className="loading-error" role="alert">
          响应稍慢，你可以继续等待或使用演示结果。
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={retry}>重新尝试</button>
            <button className="btn btn-secondary" onClick={viewDemo}>先看演示结果</button>
            <button className="btn btn-ghost" onClick={goBack}>返回修改</button>
          </div>
        </div>
      )}

      {pageState === "error" && (
        <div className="loading-error" role="alert">
          {errorMsg}
          {analysisId && <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-sub)" }}>分析编号：{analysisId}</div>}
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={retry}>重新生成</button>
            <button className="btn btn-secondary" onClick={goBack}>返回修改</button>
            <button className="btn btn-ghost" onClick={viewDemo}>查看演示结果</button>
          </div>
        </div>
      )}

      <p className="loading-note" style={{ marginTop: "24px" }}>Build {BUILD_VERSION}</p>
    </div>
  );
}
