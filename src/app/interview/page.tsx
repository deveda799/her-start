"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProgress, getStage, saveProgress } from "@/lib/her-start/use-progress";

const QUESTIONS = [
  {
    eyebrow: "过去经历",
    title: "回顾过去的工作和生活，哪3段经历最塑造今天的你？",
    hint: "可以是工作、育儿、家庭、转型、学习、创业、失败、成长或帮助别人的经历。",
    placeholder: "例如：我做过8年项目运营；经历过一次职业转型；过去3年一直在帮助身边的妈妈……",
  },
  {
    eyebrow: "外部认可",
    title: "别人最常因为什么事情来找你、请教你或感谢你？",
    hint: "请尽量举一个真实例子：她遇到了什么问题，你具体做了什么？",
    placeholder: "例如：同事常让我帮她拆解复杂项目，上个月我帮一位朋友……",
  },
  {
    eyebrow: "长期意愿",
    title: "哪类事情即使暂时没有收入，你也愿意长期研究、分享或帮助别人解决？",
    hint: "为什么？",
    placeholder: "例如：我愿意长期研究女性职业转型，因为……",
  },
  {
    eyebrow: "现实条件与产品期待",
    title: "如果把你已有的经验做成第一个最小产品，你希望它符合哪些条件？",
    hint: "写下每周可投入时间、线上或线下、是否出镜、交付深度，以及第一阶段想验证的收入目标。",
    placeholder: "例如：每周能投入6小时，希望线上、不出镜、从轻量一对一开始……",
  },
];

const Q4_OPTIONS = [
  "每周可投入1-3小时", "每周可投入4-8小时", "每周可投入8小时以上",
  "线上为主", "线下为主",
  "愿意出镜", "不愿出镜",
  "一对一服务", "一对多/轻交付",
  "首阶段验证0-500元", "首阶段验证500-2000元",
];

const MAX_PER = 500;
const MAX_TOTAL = 3000;
const NAME_STEP = -1; // 称呼步骤

function sanitizeName(raw: string): string {
  // 去首尾空格，过滤 HTML/脚本标签
  return raw.trim().replace(/[<>]/g, "").slice(0, 20);
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFollowup = searchParams.get("followup") === "1";
  const { progress, update, loaded } = useProgress();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [error, setError] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const stage = getStage(progress);

  // 初始化
  useEffect(() => {
    if (!loaded) return;
    if (stage === "completed") {
      router.push("/result");
      return;
    }
    if (isFollowup && progress.followupQuestion) {
      setFollowupAnswer(progress.followupAnswer ?? "");
      return;
    }
    // 如果有 displayName，跳过称呼步骤
    const startStep = progress.displayName ? Math.min(progress.step, 3) : NAME_STEP;
    setStep(startStep);
    setNameInput(progress.displayName ?? "");
    if (startStep >= 0) {
      setAnswer(progress.answers[startStep] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, isFollowup]);

  useEffect(() => {
    if (step >= 0 && !isFollowup) {
      setAnswer(progress.answers[step] ?? "");
      setChips([]);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === NAME_STEP) {
      nameInputRef.current?.focus();
    } else {
      textareaRef.current?.focus();
    }
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [step, isFollowup]);

  const totalChars = progress.answers.reduce((s, a) => s + a.length, 0) - (progress.answers[step]?.length ?? 0) + answer.length;

  function submitName() {
    const clean = sanitizeName(nameInput);
    if (clean && clean.length < 2) {
      setError("称呼至少2个字符，或留空跳过。");
      return;
    }
    setError("");
    saveProgress({ displayName: clean });
    update({ displayName: clean });
    setStep(0);
  }

  function skipName() {
    setError("");
    saveProgress({ displayName: "" });
    update({ displayName: "" });
    setStep(0);
  }

  function next() {
    if (submitting) return;
    if (!answer.trim()) {
      setError("还差一点，请补充完成当前问题后再生成开局方案。");
      textareaRef.current?.focus();
      return;
    }
    if (answer.length > MAX_PER || totalChars > MAX_TOTAL) {
      setError(`单题不超过${MAX_PER}字，全部回答不超过${MAX_TOTAL}字。请稍作精简。`);
      return;
    }
    setError("");

    const nextAnswers = [...progress.answers];
    nextAnswers[step] = answer;
    saveProgress({ answers: nextAnswers, step });

    if (step < 3) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      update({ answers: nextAnswers, step });
      router.push("/analyzing");
    }
  }

  function prev() {
    if (submitting) return;
    if (step === 0) {
      // 回到称呼步骤
      setNameInput(progress.displayName ?? "");
      setStep(NAME_STEP);
      return;
    }
    saveProgress({ answers: progress.answers, step });
    setStep(step - 1);
  }

  function submitFollowup() {
    if (submitting) return;
    if (!followupAnswer.trim()) {
      setError("请回答这个关键问题，价值镜才能更准确地为你生成方案。");
      return;
    }
    if (followupAnswer.length > MAX_PER) {
      setError(`回答不超过${MAX_PER}字。`);
      return;
    }
    setError("");
    setSubmitting(true);
    saveProgress({ followupAnswer });
    update({ followupAnswer });
    router.push("/analyzing");
  }

  function toggleChip(label: string) {
    if (submitting) return;
    if (chips.includes(label)) {
      setChips(chips.filter((c) => c !== label));
    } else {
      setChips([...chips, label]);
    }
  }

  function appendChips() {
    if (chips.length === 0) return;
    const chipText = chips.join("；");
    const existing = answer.replace(/\s*$/, "");
    const sep = existing && !existing.endsWith("；") && !existing.endsWith("。") ? "；" : "";
    setAnswer(existing + sep + chipText + "。");
    setChips([]);
  }

  // ===== 动态追问模式 =====
  if (isFollowup && progress.followupQuestion) {
    return (
      <div className="chat-page">
        <div className="chat-top">
          <div className="chat-top-title">价值镜补充确认</div>
          <div className="chat-top-sub">动态追问 · 1/1</div>
          <div className="chat-top-progress">
            <span style={{ width: "80%" }} />
          </div>
        </div>
        <div className="chat-body" ref={chatBodyRef}>
          <div className="chat-bubble-row">
            <div className="chat-avatar">镜</div>
            <div className="chat-bubble ai">
              <div className="chat-question-eyebrow">VALUE MIRROR</div>
              <p style={{ fontSize: "14px", lineHeight: 1.65, marginBottom: "12px" }}>
                我已经看到一些重要线索。在生成你的开局方案之前，还想确认最后一个关键细节。
              </p>
              <div className="chat-question-title">{progress.followupQuestion}</div>
            </div>
          </div>
          {progress.followupAnswer && progress.followupAnswer !== followupAnswer && (
            <div className="chat-bubble-row user">
              <div className="chat-avatar" style={{ background: "var(--emerald-main)" }}>我</div>
              <div className="chat-bubble user">{progress.followupAnswer}</div>
            </div>
          )}
        </div>
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={followupAnswer}
            maxLength={MAX_PER}
            placeholder="请回答这个关键问题，帮助价值镜更准确地为你生成方案……"
            onChange={(e) => { setFollowupAnswer(e.target.value); setError(""); }}
            aria-label="动态追问回答"
          />
          <div className="chat-meta">
            <span className={error ? "chat-meta-error" : ""} role="alert">{error}</span>
            <span>{followupAnswer.length} / {MAX_PER}</span>
          </div>
          <div className="chat-actions">
            <button
              className="btn btn-primary btn-full"
              onClick={submitFollowup}
              disabled={submitting}
            >
              {submitting ? "正在生成你的开局方案…" : "完成回答，生成方案"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 称呼步骤 =====
  if (step === NAME_STEP) {
    return (
      <div className="chat-page">
        <div className="chat-top">
          <div className="chat-top-title">开始之前</div>
          <div className="chat-top-sub">称呼（选填）</div>
          <div className="chat-top-progress">
            <span style={{ width: "5%" }} />
          </div>
        </div>
        <div className="chat-body" ref={chatBodyRef}>
          <div className="chat-bubble-row">
            <div className="chat-avatar">镜</div>
            <div className="chat-bubble ai">
              <div className="chat-question-eyebrow">VALUE MIRROR</div>
              <div className="chat-question-title">怎么称呼你？</div>
              <div className="chat-question-hint">
                填写昵称即可，无需使用真实姓名。这个称呼会出现在你的人生资产报告中。
              </div>
            </div>
          </div>
        </div>
        <div className="chat-input-area">
          <input
            ref={nameInputRef}
            type="text"
            className="chat-textarea"
            style={{ minHeight: "52px", maxHeight: "52px" }}
            value={nameInput}
            maxLength={20}
            placeholder="例如：玉琴、小林、Jenny（留空则显示「你」）"
            onChange={(e) => { setNameInput(e.target.value); setError(""); }}
            aria-label="称呼"
          />
          <div className="chat-meta">
            <span className={error ? "chat-meta-error" : ""} role="alert">{error}</span>
            <span>{nameInput.length} / 20</span>
          </div>
          <div className="chat-actions">
            <button className="btn btn-secondary" onClick={skipName} disabled={submitting} style={{ flex: 1 }}>
              跳过
            </button>
            <button className="btn btn-primary" onClick={submitName} disabled={submitting} style={{ flex: 2 }}>
              继续
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 标准四问模式 =====
  const q = QUESTIONS[step];
  const progressPercent = ((step + 1) / 4) * 100;
  const isLastStep = step === 3;

  return (
    <div className="chat-page">
      <div className="chat-top">
        <div className="chat-top-title">第一关 · 看见自己</div>
        <div className="chat-top-sub">问题 {step + 1} / 4</div>
        <div className="chat-top-progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div className="chat-body" ref={chatBodyRef}>
        <div className="chat-bubble-row">
          <div className="chat-avatar">镜</div>
          <div className="chat-bubble ai">
            <div className="chat-question-eyebrow">{q.eyebrow}</div>
            <div className="chat-question-title">{q.title}</div>
            <div className="chat-question-hint">{q.hint}</div>
          </div>
        </div>
        {progress.answers[step] && progress.answers[step] !== answer && (
          <div className="chat-bubble-row user">
            <div className="chat-avatar" style={{ background: "var(--emerald-main)" }}>我</div>
            <div className="chat-bubble user">{progress.answers[step]}</div>
          </div>
        )}
      </div>
      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={answer}
          maxLength={MAX_PER}
          placeholder={q.placeholder}
          onChange={(e) => { setAnswer(e.target.value); setError(""); }}
          aria-label={q.title}
        />
        {isLastStep && (
          <div className="option-chips">
            {Q4_OPTIONS.map((label) => (
              <button
                key={label}
                type="button"
                className={`option-chip${chips.includes(label) ? " selected" : ""}`}
                onClick={() => toggleChip(label)}
                disabled={submitting}
              >
                {label}
              </button>
            ))}
            {chips.length > 0 && (
              <button type="button" className="option-chip selected" onClick={appendChips} disabled={submitting}>
                加入回答
              </button>
            )}
          </div>
        )}
        <div className="chat-meta">
          <span className={error ? "chat-meta-error" : ""} role="alert">{error}</span>
          <span>{answer.length} / {MAX_PER} · 共 {totalChars} / {MAX_TOTAL}</span>
        </div>
        <div className="chat-actions">
          <button className="btn btn-secondary" onClick={prev} disabled={submitting} style={{ flex: 1 }}>
            上一步
          </button>
          <button
            className="btn btn-primary"
            onClick={next}
            disabled={submitting}
            style={{ flex: 2 }}
          >
            {submitting
              ? "正在生成你的开局方案…"
              : isLastStep
                ? "完成照见，生成开局方案"
                : "继续"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: "120px 20px", textAlign: "center", color: "var(--text-sub)" }}>加载中…</div>}>
      <InterviewContent />
    </Suspense>
  );
}
