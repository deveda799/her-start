import type { HerStartAnalysis } from "@/lib/her-start/schema";
import { demoAnalysis } from "@/lib/her-start/demo";
import { useEffect, useState, useCallback } from "react";

export const BUILD_VERSION = "20260719-2200";
export const PROGRESS_VERSION = "v4";
export const SCHEMA_VERSION = "v4";
export const PROMPT_VERSION = "v2";

const STORAGE_KEY = "her-start:v4:progress";
const RESULT_KEY = "her-start:v4:result";
const CACHE_PREFIX = "her-start:v4:cache-";
const OLD_KEY_PATTERNS = ["her-start-progress", "her-start-result", "her-start-cache", "her-start:v3:", "her-start:v2:", "her-start-v"];

export type AnalysisMode = "ai" | "demo";
export type DemoReason = "missing_config" | "provider_error" | "timeout" | "schema_invalid" | "rate_limit" | "global_limit" | "network_error" | "empty_content" | "parse_error";

export type ProgressData = {
  version: string;
  buildVersion: string;
  displayName: string;
  answers: string[];
  step: number;
  followupQuestion: string | null;
  followupAnswer: string | null;
  followupUsed: boolean;
  result: HerStartAnalysis | null;
  isDemo: boolean;
  mode: AnalysisMode | null;
  personalized: boolean;
  analysisId: string | null;
  demoReason: DemoReason | null;
  showNameInReport: boolean;
  points: number;
  createdAt: string | null;
};

const EMPTY: ProgressData = {
  version: PROGRESS_VERSION,
  buildVersion: BUILD_VERSION,
  displayName: "",
  answers: ["", "", "", ""],
  step: 0,
  followupQuestion: null,
  followupAnswer: null,
  followupUsed: false,
  result: null,
  isDemo: false,
  mode: null,
  personalized: false,
  analysisId: null,
  demoReason: null,
  showNameInReport: true,
  points: 0,
  createdAt: null,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** 清除所有 Her Start 相关旧版数据 */
export function purgeAllHerStartData() {
  if (!isBrowser()) return;
  try {
    // 清除当前版本
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RESULT_KEY);
    // 清除缓存
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
      // 清除旧版 key
      for (const pattern of OLD_KEY_PATTERNS) {
        if (k.startsWith(pattern) || k === pattern) localStorage.removeItem(k);
      }
    }
  } catch { /* ignore */ }
}

/** 从 localStorage 读取最新进度 */
export function loadProgress(): ProgressData {
  if (!isBrowser()) return { ...EMPTY };
  try {
    // 先检查是否有旧版数据需要清除
    const keys = Object.keys(localStorage);
    let hasOldData = false;
    for (const k of keys) {
      for (const pattern of OLD_KEY_PATTERNS) {
        if (k.startsWith(pattern) || k === pattern) {
          hasOldData = true;
          break;
        }
      }
      if (hasOldData) break;
    }
    if (hasOldData) {
      // 旧版数据：不迁移，直接清除
      purgeAllHerStartData();
      return { ...EMPTY };
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };

    const saved = JSON.parse(raw) as Partial<ProgressData>;
    // 版本不一致：清除，不迁移
    if (saved.version && saved.version !== PROGRESS_VERSION) {
      purgeAllHerStartData();
      return { ...EMPTY };
    }

    return {
      ...EMPTY,
      ...saved,
      answers: Array.isArray(saved.answers) && saved.answers.length === 4 ? saved.answers : ["", "", "", ""],
    };
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    return { ...EMPTY };
  }
}

/** 同步写入 localStorage */
export function saveProgress(patch: Partial<ProgressData>): ProgressData {
  if (!isBrowser()) return { ...EMPTY };
  try {
    const current = loadProgress();
    const next: ProgressData = { ...current, ...patch, version: PROGRESS_VERSION, buildVersion: BUILD_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return { ...EMPTY };
  }
}

/** 清除分析结果但保留称呼和回答 */
export function clearAnalysisResult(): ProgressData {
  if (!isBrowser()) return { ...EMPTY };
  const current = loadProgress();
  const cleared: ProgressData = {
    ...EMPTY,
    version: PROGRESS_VERSION,
    buildVersion: BUILD_VERSION,
    displayName: current.displayName,
    answers: current.answers,
    step: current.step,
    showNameInReport: current.showNameInReport,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared)); } catch { /* ignore */ }
  return cleared;
}

/** 完全重置 */
export function resetAllProgress(): ProgressData {
  if (!isBrowser()) return { ...EMPTY };
  purgeAllHerStartData();
  return { ...EMPTY };
}

// ========== 缓存 ==========

function normalizeInput(answers: string[], fq?: string, fa?: string): string {
  const parts = [
    PROMPT_VERSION,
    SCHEMA_VERSION,
    ...answers.map((a) => a.trim().replace(/\s+/g, " ")),
    (fq ?? "").trim().replace(/\s+/g, " "),
    (fa ?? "").trim().replace(/\s+/g, " "),
  ];
  return parts.join("\n");
}

export function computeCacheKey(answers: string[], fq?: string, fa?: string): string {
  const normalized = normalizeInput(answers, fq, fa);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return CACHE_PREFIX + Math.abs(hash).toString(36);
}

export function getCachedResult(answers: string[], fq?: string, fa?: string): HerStartAnalysis | null {
  if (!isBrowser()) return null;
  try {
    const key = computeCacheKey(answers, fq, fa);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as HerStartAnalysis;
  } catch {
    return null;
  }
}

export function setCachedResult(answers: string[], result: HerStartAnalysis, fq?: string, fa?: string) {
  if (!isBrowser()) return;
  try {
    const key = computeCacheKey(answers, fq, fa);
    localStorage.setItem(key, JSON.stringify(result));
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
    if (keys.length > 20) {
      for (let i = 0; i < keys.length - 20; i++) localStorage.removeItem(keys[i]);
    }
  } catch { /* ignore */ }
}

// ========== 显示辅助 ==========

export function getDisplayName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed || "你";
}

export type Stage = "idle" | "interviewing" | "needs_followup" | "completed";

export function getStage(p: ProgressData): Stage {
  if (p.result) return "completed";
  if (p.followupQuestion) return "needs_followup";
  if (p.answers.every((a) => a.trim().length > 0)) return "needs_followup";
  if (p.answers.some((a) => a.trim().length > 0)) return "interviewing";
  return "idle";
}

export function getProgressPercent(stage: Stage): number {
  switch (stage) {
    case "idle": return 0;
    case "interviewing": return 20;
    case "needs_followup": return 50;
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

export function makeShortAnalysisId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "HS-";
  for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ========== React Hook ==========

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>({ ...EMPTY });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 检查 ?reset=1 参数
    if (isBrowser()) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("reset") === "1") {
        purgeAllHerStartData();
        // 清除 URL 参数
        url.searchParams.delete("reset");
        window.history.replaceState({}, "", url.toString());
      }
    }
    setProgress(loadProgress());
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<ProgressData>) => {
    setProgress((prev) => {
      const next = saveProgress({ ...prev, ...patch });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const cleared = resetAllProgress();
    setProgress(cleared);
  }, []);

  const startNewAnalysis = useCallback(() => {
    const cleared = clearAnalysisResult();
    setProgress(cleared);
  }, []);

  const refresh = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  return { progress, update, reset, startNewAnalysis, refresh, loaded, BUILD_VERSION };
}

export const DEMO_ANALYSIS = demoAnalysis;
