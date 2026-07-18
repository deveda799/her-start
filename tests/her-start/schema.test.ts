import { describe, expect, it } from "vitest";
import { demoAnalysis } from "@/lib/her-start/demo";
import { analysisSchema, interviewSchema } from "@/lib/her-start/schema";

describe("Her Start contracts", () => {
  it("accepts the complete demo result", () => {
    expect(analysisSchema.parse(demoAnalysis).actionCard.actions.some((item) => item.realUserContact)).toBe(true);
    expect(demoAnalysis.lifeAssetCard.assets).toHaveLength(3);
  });

  it("rejects incomplete or excessive interview answers", () => {
    expect(interviewSchema.safeParse({ answers: ["a", "b"], requestId: "request-123" }).success).toBe(false);
    expect(interviewSchema.safeParse({ answers: ["a".repeat(801), "b", "c", "d"], requestId: "request-123" }).success).toBe(false);
  });

  it("rejects actions longer than thirty minutes", () => {
    const invalid = structuredClone(demoAnalysis);
    invalid.actionCard.actions[0].estimatedMinutes = 31;
    expect(analysisSchema.safeParse(invalid).success).toBe(false);
  });
});
