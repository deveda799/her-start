"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { demoAnalysis } from "@/lib/her-start/demo";
import type { HerStartAnalysis } from "@/lib/her-start/schema";

const questions = [
  { eyebrow: "过去经历", title: "哪 3 段经历，最塑造今天的你？", hint: "可以是工作、育儿、家庭、转型、学习、失败、成长，或帮助别人的经历。", placeholder: "例如：我做过8年项目运营；经历过一次职业转型；过去3年一直在帮助身边的妈妈……" },
  { eyebrow: "外部认可", title: "别人最常因为什么事来找你？", hint: "请尽量举一个真实例子：她遇到了什么问题，你具体做了什么？", placeholder: "例如：同事常让我帮她拆解复杂项目，上个月我帮一位朋友……" },
  { eyebrow: "长期意愿", title: "哪类事情，你愿意长期研究和分享？", hint: "即使暂时没有收入，你也愿意继续帮助别人解决什么问题？为什么？", placeholder: "例如：我愿意长期研究女性职业转型，因为……" },
  { eyebrow: "现实条件", title: "你的第一个最小产品，需要符合什么条件？", hint: "写下每周可投入时间、线上或线下、是否出镜、交付深度，以及第一阶段想验证的收入目标。", placeholder: "例如：每周能投入6小时，希望线上、不出镜、从轻量一对一开始……" },
];

type Screen = "home" | "interview" | "loading" | "result";
const STORAGE_KEY = "her-start-v1";

export function HerStartExperience() {
  const [screen, setScreen] = useState<Screen>("home");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<HerStartAnalysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [points, setPoints] = useState(0);
  const [loadingLine, setLoadingLine] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const totalCharacters = useMemo(() => answers.reduce((sum, value) => sum + value.length, 0), [answers]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as { answers?: string[]; step?: number; result?: HerStartAnalysis; demo?: boolean; points?: number } | null;
      if (saved?.answers?.length === 4) { setAnswers(saved.answers); setStep(Math.min(saved.step ?? 0, 3)); }
      if (saved?.result) { setResult(saved.result); setIsDemo(Boolean(saved.demo)); setPoints(saved.points ?? 100); setScreen("result"); }
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  useEffect(() => {
    if (screen === "interview") textareaRef.current?.focus();
  }, [step, screen]);

  useEffect(() => {
    if (screen !== "loading") return;
    const timer = window.setInterval(() => setLoadingLine((line) => (line + 1) % 4), 1800);
    return () => window.clearInterval(timer);
  }, [screen]);

  function save(nextAnswers = answers, nextStep = step) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: nextAnswers, step: nextStep }));
  }

  function next() {
    if (!answers[step].trim()) { setError("写下一点真实经历，价值镜才能继续帮你梳理。 "); textareaRef.current?.focus(); return; }
    if (answers[step].length > 800 || totalCharacters > 3000) { setError("单题不超过800字，全部回答不超过3000字。请稍作精简。"); return; }
    setError("");
    if (step < 3) { const nextStep = step + 1; setStep(nextStep); save(answers, nextStep); return; }
    void submit();
  }

  async function submit() {
    setScreen("loading"); save();
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30_000);
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, requestId: crypto.randomUUID() }), signal: controller.signal });
      window.clearTimeout(timeout);
      const data = await response.json() as { result?: HerStartAnalysis; demo?: boolean; message?: string };
      if (!response.ok || !data.result) throw new Error(data.message || "分析暂时没有完成");
      setResult(data.result); setIsDemo(Boolean(data.demo)); setPoints(100); setScreen("result");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step, result: data.result, demo: data.demo, points: 100 }));
    } catch {
      setResult(demoAnalysis); setIsDemo(true); setPoints(100); setScreen("result");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step, result: demoAnalysis, demo: true, points: 100 }));
    }
  }

  function restart() { localStorage.removeItem(STORAGE_KEY); setAnswers(["", "", "", ""]); setStep(0); setResult(null); setPoints(0); setError(""); setScreen("home"); }

  return <main id="main-content" className="her-shell">
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <header className="brand-bar"><span className="brand-mark" aria-hidden="true">她</span><span>她来开局</span><span className="brand-divider" /><span>Her Start</span></header>

    {screen === "home" && <section className="hero-card">
      <div className="hero-kicker">VALUE MIRROR · 价值镜</div>
      <h1>她来开局</h1>
      <p className="hero-subtitle">女性人生资产发现与商业化 AI 陪练</p>
      <p className="hero-quote">你不是没有价值，<br />只是还没有重新看见自己走过的路。</p>
      <button className="primary-button" onClick={() => setScreen("interview")}>开始照见我的人生资产 <Arrow /></button>
      <div className="trust-row" aria-label="体验说明"><span><Check />约 5 分钟</span><span><Check />无需注册</span><span><Check />AI 分析</span></div>
      <div className="journey-preview"><Journey n="01" title="看见自己" text="从经历中发现人生资产" /><Journey n="02" title="做成产品" text="形成一个最小产品" /><Journey n="03" title="走向市场" text="完成24小时真实验证" /></div>
      <p className="legal-note">结果是商业价值假设，不构成收入承诺，仍需通过真实用户验证。</p>
    </section>}

    {screen === "interview" && <section className="interview-card">
      <Progress current={step} />
      <div className="question-count">第 {step + 1} 问 · 共 4 问</div>
      <p className="question-eyebrow">{questions[step].eyebrow}</p>
      <h1 className="question-title">{questions[step].title}</h1>
      <p className="question-hint">{questions[step].hint}</p>
      <label className="sr-only" htmlFor="answer">{questions[step].title}</label>
      <textarea ref={textareaRef} id="answer" value={answers[step]} maxLength={800} placeholder={questions[step].placeholder} onChange={(event) => { const next = [...answers]; next[step] = event.target.value; setAnswers(next); setError(""); save(next); }} />
      <div className="field-meta"><span role="alert">{error}</span><span>{answers[step].length} / 800</span></div>
      <div className="button-row"><button className="secondary-button" disabled={step === 0} onClick={() => { setStep(step - 1); setError(""); }}>上一步</button><button className="primary-button compact" onClick={next}>{step === 3 ? "生成我的开局卡" : "继续"}<Arrow /></button></div>
      <p className="privacy-note"><Lock />回答仅用于本次分析，并保存在你的浏览器中</p>
    </section>}

    {screen === "loading" && <section className="loading-card" aria-live="polite" aria-busy="true"><div className="mirror-loader"><span /></div><p className="question-eyebrow">VALUE MIRROR</p><h1>价值镜正在为你梳理</h1><p>{["正在整理你走过的路……", "正在寻找那些被你低估的能力……", "正在把经历重新组织为人生资产……", "正在生成你的第一张开局卡……"][loadingLine]}</p><div className="loading-track"><span /></div><small>这通常需要 10—30 秒，请不要关闭页面</small></section>}

    {screen === "result" && result && <section className="results">
      <div className="result-heading"><p className="question-eyebrow">你的开局答案</p><h1>你的人生资产，正在成为产品</h1><p>以下判断基于你提供的事实，其中商业价值与价格仍是待验证假设。</p></div>
      {isDemo && <div className="demo-banner" role="status"><strong>当前展示演示结果</strong><span>正式分析需要连接 AI 服务。这份案例不是针对你的真实分析。</span></div>}
      <article className="result-card asset-card"><CardHeader number="01" label="第一关 · 看见自己" title="人生资产卡" /><p className="positioning">“{result.lifeAssetCard.valuePositioning}”</p><div className="asset-grid">{result.lifeAssetCard.assets.map((asset, index) => <div className="asset-item" key={asset.name}><span>0{index + 1}</span><h3>{asset.name}</h3><p>{asset.formedAbility}</p><small>【事实】{asset.factEvidence}</small></div>)}</div><div className="card-insight"><b>核心可迁移能力</b><p>{result.lifeAssetCard.coreTransferableAbility}</p></div></article>
      <article className="result-card product-card"><CardHeader number="02" label="第二关 · 做成产品" title="最小产品卡" /><div className="product-name"><small>唯一主推荐路径</small><h2>{result.minimumProductCard.productName}</h2><p>{result.minimumProductCard.primaryPath}</p></div><dl className="details"><div><dt>目标用户</dt><dd>{result.minimumProductCard.targetUser}</dd></div><div><dt>付费问题</dt><dd>{result.minimumProductCard.problem}</dd></div><div><dt>交付方式</dt><dd>{result.minimumProductCard.delivery}</dd></div><div><dt>建议测试价格</dt><dd className="gold-text">{result.minimumProductCard.testPrice}</dd></div><div><dt>可能付费理由</dt><dd>{result.minimumProductCard.paymentReason}</dd></div><div><dt>首批潜在用户</dt><dd>{result.minimumProductCard.firstCustomers}</dd></div></dl><p className="validation"><b>【待验证假设】</b>{result.minimumProductCard.validationNote}</p></article>
      <article className="result-card action-card"><CardHeader number="03" label="第三关 · 走向市场" title="24 小时行动卡" /><div className="actions">{result.actionCard.actions.map((action, index) => <div className="action" key={action.task}><span className="action-number">{index + 1}</span><div><h3>{action.task}</h3><p>{action.completionCriteria}</p><small>{action.estimatedMinutes} 分钟{action.realUserContact ? " · 接触真实用户" : ""}</small></div></div>)}</div><div className="badge"><span className="badge-seal">她</span><div><small>已解锁徽章</small><strong>{result.actionCard.badge}</strong></div><b>{points} 分</b></div></article>
      <blockquote>{result.closing}</blockquote>
      <div className="result-actions"><button className="secondary-button" onClick={() => { setScreen("interview"); setStep(0); }}>修改答案</button><button className="primary-button compact" onClick={restart}>重新开局</button></div>
    </section>}
    <footer>Her Start · 她来开局 <span>人生资产发现与商业化 AI 陪练</span></footer>
  </main>;
}

function Journey({ n, title, text }: { n: string; title: string; text: string }) { return <div><span>{n}</span><section><b>{title}</b><small>{text}</small></section></div>; }
function Progress({ current }: { current: number }) { return <div className="progress" aria-label={`第一关，第${current + 1}题`}><div className="progress-labels"><b>第一关 · 看见自己</b><span>第二关 · 做成产品</span><span>第三关 · 走向市场</span></div><div className="progress-track"><span style={{ width: `${8 + current * 10}%` }} /></div></div>; }
function CardHeader({ number, label, title }: { number: string; label: string; title: string }) { return <header className="card-header"><span>{number}</span><div><small>{label}</small><h2>{title}</h2></div></header>; }
function Arrow() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function Check() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-8" /></svg>; }
function Lock() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>; }
