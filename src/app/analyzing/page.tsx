"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProgress, loadProgress, getLevel, getDisplayName, BUILD_VERSION, type ProgressData } from "@/lib/her-start/use-progress";
import { runAnalysis, enterDemoResult, type AnalysisState } from "@/lib/her-start/orchestrator";
import type { HerStartAnalysis } from "@/lib/her-start/schema";
import { BadgeSeal } from "@/components/her-start/brand-icons";

const LOADING_LINES = [
  "正在整理你走过的路……",
  "正在寻找那些被你低估的能力……",
  "正在把经历重新组织为人生资产……",
  "正在生成你的第一个最小产品……",
];

type PageState = "loading" | "error" | "result";

export default function AnalyzingPage() {
  const router = useRouter();
  const { loaded } = useProgress();
  const [line, setLine] = useState(0);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisId, setAnalysisId] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<HerStartAnalysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [personalized, setPersonalized] = useState(false);
  const [displayName, setDisplayName] = useState("你");
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
    if (!loaded || startedRef.current) return;
    startedRef.current = true;

    const fresh = loadProgress();
    setDisplayName(getDisplayName(fresh.displayName));

    if (!fresh.answers.every((a) => a.trim().length > 0)) {
      router.push("/interview");
      return;
    }

    void doRunAnalysis();

    async function doRunAnalysis() {
      const state: AnalysisState = await runAnalysis();

      switch (state.phase) {
        case "idle":
          router.push("/interview");
          break;

        case "needs_followup":
          setAnalysisId(state.analysisId);
          setTimeout(() => router.push("/interview?followup=1"), 300);
          break;

        case "success":
          setAnalysisId(state.analysisId);
          setResult(state.result);
          setIsDemo(state.mode === "demo");
          setPersonalized(state.personalized);
          // 同时写入 localStorage（辅助，失败不阻止显示）
          try {
            const fresh2 = loadProgress();
            if (!fresh2.result) {
              enterDemoResult();
            }
          } catch { /* ignore */ }
          setPageState("result");
          break;

        case "error":
          setAnalysisId(state.analysisId);
          setErrorMsg(state.reason);
          // 错误时直接展示演示结果
          enterDemoResult();
          { const demoFresh = loadProgress(); if (demoFresh.result) { setResult(demoFresh.result); } }
          setIsDemo(true);
          setPersonalized(false);
          setPageState("result");
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function retry() {
    startedRef.current = false;
    setPageState("loading");
    setErrorMsg("");
    setResult(null);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setTimeout(() => window.location.reload(), 100);
  }

  function viewDemo() {
    enterDemoResult();
    const fresh = loadProgress();
    setResult(fresh.result);
    setIsDemo(true);
    setPersonalized(false);
    setPageState("result");
  }

  function goBack() {
    router.push("/interview");
  }

  const showSlowHint = elapsed >= 15;
  const showTimeoutHint = elapsed >= 30;

  // ===== 结果展示模式 =====
  if (pageState === "result" && result) {
    const r = result;
    const level = getLevel(100);
    return (
      <div className="app-shell">
        <main className="page-content result-page">
          <div className="result-top">
            <div className="result-eyebrow">{displayName}的开局成果</div>
            <h1 className="result-title">{displayName}的人生资产开局报告</h1>
            <div className="result-badge-bar">
              <span className="result-stat">100 经验值</span>
              <span className="result-stat">Lv{level.level} {level.name}</span>
              <span className="result-stat">「开局行动者」徽章</span>
            </div>
          </div>

          {isDemo ? (
            <div className="demo-banner" role="status" style={{ background: "#FEF0EE", borderColor: "#E8B5B0", color: "#8B2D26" }}>
              <strong>当前为演示结果</strong>
              当前AI服务尚未连接或暂时不可用，以下内容为功能示例，不是根据你本次回答生成的个性化分析。
            </div>
          ) : (
            <div className="demo-banner" role="status" style={{ background: "var(--emerald-light)", borderColor: "var(--emerald-bright)", color: "var(--emerald-deep)" }}>
              <strong>已根据你本次提供的经历生成个性化分析。</strong>
            </div>
          )}

          {/* 人生资产卡 */}
          <article className="result-card asset">
            <header className="rc-header">
              <span className="rc-number">01</span>
              <div>
                <div className="rc-label">第一关 · 看见自己</div>
                <div className="rc-title">人生资产卡</div>
              </div>
            </header>
            <div className="rc-body">
              <p className="positioning">「{r.lifeAssetCard.valuePositioning}」</p>
              {r.lifeAssetCard.assets.map((asset, i) => (
                <div className="asset-item" key={i}>
                  <div className="asset-name">0{i + 1} {asset.name}</div>
                  <div className="asset-row"><span className="asset-label">经历来源</span><span className="asset-value">{asset.source}</span></div>
                  <div className="asset-row"><span className="asset-label">形成能力</span><span className="asset-value">{asset.formedAbility}</span></div>
                  <div className="asset-row"><span className="asset-label">可迁移价值</span><span className="asset-value">{asset.transferableValue}</span></div>
                  <div className="asset-row"><span className="asset-label">事实依据</span><span className="asset-value">{asset.factEvidence}</span></div>
                </div>
              ))}
              <div className="card-insight">
                <div className="card-insight-label">核心可迁移能力</div>
                <div className="card-insight-text">{r.lifeAssetCard.coreTransferableAbility}</div>
              </div>
            </div>
          </article>

          {/* 最小产品卡 */}
          <article className="result-card product">
            <header className="rc-header">
              <span className="rc-number">02</span>
              <div>
                <div className="rc-label">第二关 · 做成产品</div>
                <div className="rc-title">最小产品卡</div>
              </div>
            </header>
            <div className="rc-body">
              <div className="product-hero">
                <small>唯一主商业路径</small>
                <h3>{r.minimumProductCard.productName}</h3>
                <p>{r.minimumProductCard.primaryPath}</p>
              </div>
              <div className="detail-grid">
                <div className="detail-row"><span className="detail-label">目标用户</span><span className="detail-value">{r.minimumProductCard.targetUser}</span></div>
                <div className="detail-row"><span className="detail-label">解决的问题</span><span className="detail-value">{r.minimumProductCard.problem}</span></div>
                <div className="detail-row"><span className="detail-label">交付方式</span><span className="detail-value">{r.minimumProductCard.delivery}</span></div>
                <div className="detail-row"><span className="detail-label">建议测试价格</span><span className="detail-value gold">{r.minimumProductCard.testPrice}</span></div>
                <div className="detail-row"><span className="detail-label">付费理由</span><span className="detail-value">{r.minimumProductCard.paymentReason}</span></div>
                <div className="detail-row"><span className="detail-label">首批潜在用户</span><span className="detail-value">{r.minimumProductCard.firstCustomers}</span></div>
              </div>
              <div className="validation-note">
                <strong>【待验证假设】</strong>{r.minimumProductCard.validationNote}
              </div>
            </div>
          </article>

          {/* 24小时行动卡 */}
          <article className="result-card action">
            <header className="rc-header">
              <span className="rc-number">03</span>
              <div>
                <div className="rc-label">第三关 · 走向市场</div>
                <div className="rc-title">24小时行动卡</div>
              </div>
            </header>
            <div className="rc-body">
              {r.actionCard.actions.map((action, i) => (
                <div className="action-item" key={i}>
                  <div className="action-num">{i + 1}</div>
                  <div className="action-content">
                    <div className="action-task">{action.task}</div>
                    <div className="action-criteria">完成标准：{action.completionCriteria}</div>
                    <div className="action-meta">
                      <span>{action.estimatedMinutes}分钟</span>
                      {action.realUserContact && <span className="real-user-tag">真实用户验证</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="badge-bar">
                <BadgeSeal size={48} />
                <div className="badge-bar-text">
                  <div className="badge-bar-label">已解锁徽章</div>
                  <div className="badge-bar-name">{r.actionCard.badge}</div>
                </div>
                <div className="badge-bar-points">100分</div>
              </div>
            </div>
          </article>

          <div className="closing-quote">{r.closing}</div>

          <div className="result-actions">
            <Link href="/" className="btn btn-ghost btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              返回首页
            </Link>
          </div>
        </main>
        <p className="loading-note" style={{ textAlign: "center", padding: "16px", fontSize: "12px", color: "var(--text-sub)" }}>
          Build {BUILD_VERSION}
        </p>
      </div>
    );
  }

  // ===== 加载/错误模式 =====
  return (
    <div className="loading-page">
      <div className="loading-ring" aria-hidden="true" />
      <div className="loading-kicker">VALUE MIRROR · 价值镜</div>
      <h1 className="loading-title">价值镜正在为你梳理</h1>
      <p className="loading-line" aria-live="polite">{LOADING_LINES[line]}</p>
      <div className="loading-bar"><span /></div>

      {analysisId && <p className="loading-note">分析编号：{analysisId}</p>}

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
            <button className="btn btn-secondary" onClick={viewDemo}>查看演示结果</button>
            <button className="btn btn-ghost" onClick={goBack}>返回修改</button>
          </div>
        </div>
      )}

      <p className="loading-note" style={{ marginTop: "24px" }}>Build {BUILD_VERSION}</p>
    </div>
  );
}
