import { describe, expect, it } from "vitest";
import { filterRawItem } from "@/lib/collect/filter";
import type { RawItem } from "@/lib/types";

function item(title: string, summary: string): RawItem {
  return {
    title,
    summary,
    url: "https://example.com/item",
    source: "测试",
    publishedAt: null,
    sourceId: "test",
    sourceType: "manual",
  };
}

describe("filterRawItem", () => {
  it.each(["刷单", "先交费", "保证月入", "博彩", "拉人头"])(
    "rejects risky keyword %s",
    (keyword) => {
      expect(filterRawItem(item(`招聘${keyword}兼职`, "无需经验立即加入")))
        .toMatchObject({ passed: false, risk: "high" });
    },
  );

  it("rejects low-quality content", () => {
    expect(filterRawItem(item("兼职", "速来")))
      .toEqual({ passed: false, reason: "content is too short", risk: "low-quality" });
  });

  it("passes a practical public opportunity", () => {
    expect(filterRawItem(item(
      "远程项目顾问机会",
      "适合有项目管理经验的职场转型者，每周投入约十小时。",
    ))).toEqual({ passed: true });
  });
});
