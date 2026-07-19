"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadProgress } from "@/lib/her-start/use-progress";
import { runAnalysis } from "@/lib/her-start/orchestrator";

const LOADING_LINES = [
  "正在整理你走过的路……",
  "正在寻找那些被你低估的能力……",
  "正在把经历重新组织为人生资产……",
  "正在生成你的第一个最小产品……",
];

export default function AnalyzingPage() {
  const router = useRouter();
  const [line, setLine] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(false);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setLine((l) => (l + 1) % 4), 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const fresh = loadProgress();

    if (!fresh.answers.every((a) => a.trim().length > 0)) {
      router.replace("/interview");
      return;
    }

    runAnalysis({ skipFollowup: true })
      .then((state) => {
        if (state.phase === "idle") {
          router.replace("/interview");
        } else if (state.phase === "needs_followup") {
          // 本方案已禁用动态追问，但保留防御性跳转
          router.replace("/interview?followup=1");
        } else if (state.phase === "success" || state.phase === "error") {
          // 成功或失败都已将结果写入 localStorage，统一到 /result 展示
          router.replace("/result");
        }
      })
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : "分析异常，请重试。");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMsg) {
    return (
      <div className="app-shell">
        <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-sub)" }}>
          <div style={{ marginBottom: 12 }}>{errorMsg}</div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: 16 }}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-sub)" }}>
        <div style={{ fontSize: 20, marginBottom: 12 }}>{LOADING_LINES[line % LOADING_LINES.length]}</div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>已等待 {elapsed} 秒 · 最长 30 秒</div>
      </div>
    </div>
  );
}
