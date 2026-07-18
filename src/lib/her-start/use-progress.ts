import { useEffect, useState, useCallback } from "react";
import type { HerStartAnalysis } from "@/lib/her-start/schema";

export type AnalysisMode = "ai" | "demo";

export type ProgressState = {
  displayName: string;
  answers: string[];
  step: number;
  result: HerStartAnalysis | null;
  isDemo: boolean;
  mode: AnalysisMode | null;
  personalized: boolean;
  analysisId: string | null;
  demoReason: string | null;
  showNameInReport: boolean;
  points: number;
  followupQuestion: string | null;
  followupAnswer: string | null;
  createdAt: string | null;
};

const STORAGE_KEY = "her-start-v2";
const EMPTY: ProgressState = {
  displayName: "",
  answers: ["", "", "", ""],
  step: 0,
  result: null,
  isDemo: false,
  mode: null,
  personalized: false,
  analysisId: null,
  demoReason: null,
  showNameInReport: true,
  points: 0,
  followupQuestion: null,
  followupAnswer: null,
  createdAt: null,
};

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const saved = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...EMPTY,
      ...saved,
      answers: Array.isArray(saved.answers) && saved.answers.length === 4 ? saved.answers : ["", "", "", ""],
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return EMPTY;
  }
}

export function saveProgress(state: Partial<ProgressState>) {
  try {
    const current = loadProgress();
    const next = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return EMPTY;
  }
}

export function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/** 清除旧分析结果，保留 answers/displayName/showNameInReport */
export function clearAnalysisResult() {
  try {
    const current = loadProgress();
    const preserved: Partial<ProgressState> = {
      displayName: current.displayName,
      answers: current.answers,
      step: current.step,
      showNameInReport: current.showNameInReport,
    };
    const cleared: ProgressState = {
      ...EMPTY,
      ...preserved,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
    return cleared;
  } catch {
    return EMPTY;
  }
}

/** 规范化回答用于缓存 key（包含 promptVersion 和 schemaVersion） */
const PROMPT_VERSION = "v2";
const SCHEMA_VERSION = "v2";

function normalizeInput(answers: string[], followupQ?: string, followupA?: string): string {
  const parts = [
    PROMPT_VERSION,
    SCHEMA_VERSION,
    ...answers.map((a) => a.trim().replace(/\s+/g, " ")),
    (followupQ ?? "").trim().replace(/\s+/g, " "),
    (followupA ?? "").trim().replace(/\s+/g, " "),
  ];
  return parts.join("\n");
}

/** 基于完整输入生成缓存 key（不存储完整回答，只存哈希） */
export function computeCacheKey(answers: string[], followupQ?: string, followupA?: string): string {
  const normalized = normalizeInput(answers, followupQ, followupA);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `hs-${Math.abs(hash).toString(36)}`;
}

const RESULT_CACHE_PREFIX = "her-start-result-";

/** 尝试从本地缓存读取分析结果（基于输入哈希） */
export function getCachedResult(answers: string[], followupQ?: string, followupA?: string): HerStartAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const key = computeCacheKey(answers, followupQ, followupA);
    const raw = localStorage.getItem(RESULT_CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as HerStartAnalysis;
  } catch {
    return null;
  }
}

/** 缓存分析结果（基于输入哈希） */
export function setCachedResult(answers: string[], result: HerStartAnalysis, followupQ?: string, followupA?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = computeCacheKey(answers, followupQ, followupA);
    localStorage.setItem(RESULT_CACHE_PREFIX + key, JSON.stringify(result));
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(RESULT_CACHE_PREFIX));
    if (keys.length > 20) {
      for (let i = 0; i < keys.length - 20; i++) {
        localStorage.removeItem(keys[i]);
      }
    }
  } catch { /* ignore */ }
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<ProgressState>) => {
    setProgress((prev) => {
      const next = saveProgress({ ...prev, ...patch });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    clearProgress();
    setProgress({ ...EMPTY });
  }, []);

  /** 开始新分析：清除旧结果但保留称呼和回答 */
  const startNewAnalysis = useCallback(() => {
    const cleared = clearAnalysisResult();
    setProgress(cleared);
  }, []);

  return { progress, update, reset, startNewAnalysis, loaded };
}

export type Stage = "not-started" | "interviewing" | "followup" | "analyzing" | "completed";

export function getStage(p: ProgressState): Stage {
  if (p.result) return "completed";
  if (p.followupQuestion) return "followup";
  if (p.answers.every((a) => a.trim().length > 0)) return "analyzing";
  if (p.answers.some((a) => a.trim().length > 0)) return "interviewing";
  return "not-started";
}

export function getProgressPercent(stage: Stage): number {
  switch (stage) {
    case "not-started": return 0;
    case "interviewing": return 20;
    case "followup":
    case "analyzing": return 50;
    case "completed": return 100;
  }
}

export type Level = { level: number; name: string; minPoints: number };
export const LEVELS: Level[] = [
  { level: 1, name: "初见", minPoints: 0 },
  { level: 2, name: "看见", minPoints: 20 },
  { level: 3, name: "成形", minPoints: 50 },
  { level: 4, name: "开局", minPoints: 100 },
];

export function getLevel(points: number): Level {
  return [...LEVELS].reverse().find((l) => points >= l.minPoints) ?? LEVELS[0];
}

/** 获取显示名，未填写时返回"你" */
export function getDisplayName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed || "你";
}
