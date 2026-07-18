import type { RawItem } from "@/lib/types";

export type FilterDecision =
  | { passed: true }
  | { passed: false; reason: string; risk: "high" | "low-quality" };

const highRiskPatterns = [
  "刷单",
  "先交费",
  "交钱包就业",
  "保证月入",
  "轻松暴富",
  "博彩",
  "赌博",
  "拉人头",
  "发展下线",
];

export function filterRawItem(item: RawItem): FilterDecision {
  try {
    const url = new URL(item.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { passed: false, reason: "invalid public URL", risk: "low-quality" };
    }
  } catch {
    return { passed: false, reason: "invalid public URL", risk: "low-quality" };
  }

  const content = `${item.title} ${item.summary}`.trim();
  const matched = highRiskPatterns.find((pattern) => content.includes(pattern));
  if (matched) {
    return {
      passed: false,
      reason: `high-risk keyword: ${matched}`,
      risk: "high",
    };
  }
  if (!item.title.trim()) {
    return { passed: false, reason: "title is empty", risk: "low-quality" };
  }
  if (content.replace(/\s+/g, "").length < 20) {
    return { passed: false, reason: "content is too short", risk: "low-quality" };
  }
  return { passed: true };
}
