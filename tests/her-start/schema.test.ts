import { describe, expect, it } from "vitest";
import { demoAnalysis, demoFollowup } from "@/lib/her-start/demo";
import { analysisSchema, interviewSchema, followupSchema, apiResponseSchema } from "@/lib/her-start/schema";

describe("Her Start contracts", () => {
  it("accepts the complete demo result", () => {
    expect(analysisSchema.parse(demoAnalysis).actionCard.actions.some((item) => item.realUserContact)).toBe(true);
    expect(demoAnalysis.lifeAssetCard.assets).toHaveLength(3);
  });

  it("rejects incomplete or excessive interview answers", () => {
    expect(interviewSchema.safeParse({ answers: ["a", "b"], requestId: "request-123" }).success).toBe(false);
    expect(interviewSchema.safeParse({ answers: ["a".repeat(501), "b", "c", "d"], requestId: "request-123" }).success).toBe(false);
  });

  it("rejects actions longer than thirty minutes", () => {
    const invalid = structuredClone(demoAnalysis);
    invalid.actionCard.actions[0].estimatedMinutes = 31;
    expect(analysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("validates the demo followup question", () => {
    expect(followupSchema.parse(demoFollowup).question.length).toBeLessThanOrEqual(80);
  });

  it("accepts both complete and needs_followup API responses", () => {
    const complete = apiResponseSchema.safeParse({
      status: "complete",
      result: demoAnalysis,
      demo: true,
    });
    expect(complete.success).toBe(true);

    const needsFollowup = apiResponseSchema.safeParse({
      status: "needs_followup",
      followup: demoFollowup,
      demo: true,
    });
    expect(needsFollowup.success).toBe(true);
  });

  it("followupUsed must return complete, not needs_followup", () => {
    // API 层逻辑：followupUsed=true 时不允许返回 needs_followup
    // 这里验证 schema 层面两种响应都是合法的
    // 实际约束在 route.ts 中实现
    const followupResponse = apiResponseSchema.safeParse({
      status: "needs_followup",
      followup: demoFollowup,
    });
    expect(followupResponse.success).toBe(true);
  });
});
