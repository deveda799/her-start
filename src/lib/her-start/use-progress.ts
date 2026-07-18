import { useEffect, useState, useCallback } from "react";
import type { HerStartAnalysis } from "@/lib/her-start/schema";

export type ProgressState = {
  answers: string[];
  step: number;
  result: HerStartAnalysis | null;
  isDemo: boolean;
  points: number;
  followupQuestion: string | null;
  followupAnswer: string | null;
  createdAt: string | null;
};

const STORAGE_KEY = "her-start-v2";
const EMPTY: ProgressState = {
  answers: ["", "", "", ""],
  step: 0,
  result: null,
  isDemo: false,
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

  return { progress, update, reset, loaded };
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
