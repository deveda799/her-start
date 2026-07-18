import { z } from "zod";

export const interviewSchema = z.object({
  answers: z.array(z.string().trim().min(1).max(500)).length(4),
  requestId: z.string().trim().min(8).max(100),
  followup: z.object({
    question: z.string(),
    answer: z.string().min(1).max(500),
  }).optional(),
  followupUsed: z.boolean().optional(),
});

const assetSchema = z.object({
  name: z.string(),
  source: z.string(),
  formedAbility: z.string(),
  transferableValue: z.string(),
  factEvidence: z.string(),
});

export const analysisSchema = z.object({
  facts: z.array(z.string()).min(1).max(8),
  lifeAssetCard: z.object({
    assets: z.array(assetSchema).length(3),
    coreTransferableAbility: z.string(),
    valuePositioning: z.string(),
  }),
  minimumProductCard: z.object({
    primaryPath: z.string(),
    alternativePaths: z.array(z.string()).max(2),
    targetUser: z.string(),
    problem: z.string(),
    productName: z.string(),
    delivery: z.string(),
    testPrice: z.string(),
    paymentReason: z.string(),
    firstCustomers: z.string(),
    validationNote: z.string(),
  }),
  actionCard: z.object({
    actions: z.array(z.object({
      task: z.string(),
      estimatedMinutes: z.number().int().min(1).max(30),
      completionCriteria: z.string(),
      realUserContact: z.boolean(),
    })).min(1).max(3).refine((items) => items.some((item) => item.realUserContact), "至少一项行动需要接触真实用户"),
    badge: z.literal("开局行动者"),
  }),
  assumptions: z.array(z.string()).max(6),
  closing: z.string(),
});

// 动态追问 Schema
export const followupSchema = z.object({
  question: z.string().min(5).max(80),
  missingReason: z.string().min(5).max(120),
});

// API 返回的联合类型
export const apiResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("needs_followup"),
    followup: followupSchema,
    demo: z.boolean().optional(),
  }),
  z.object({
    status: z.literal("complete"),
    result: analysisSchema,
    demo: z.boolean().optional(),
  }),
]);

export type HerStartAnalysis = z.infer<typeof analysisSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type FollowupQuestion = z.infer<typeof followupSchema>;
