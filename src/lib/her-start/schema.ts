import { z } from "zod";

export const interviewSchema = z.object({
  answers: z.array(z.string().trim().min(1).max(800)).length(4),
  requestId: z.string().trim().min(8).max(100),
});

const assetSchema = z.object({
  name: z.string(), source: z.string(), formedAbility: z.string(),
  transferableValue: z.string(), factEvidence: z.string(),
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
    targetUser: z.string(), problem: z.string(), productName: z.string(),
    delivery: z.string(), testPrice: z.string(), paymentReason: z.string(),
    firstCustomers: z.string(), validationNote: z.string(),
  }),
  actionCard: z.object({
    actions: z.array(z.object({
      task: z.string(), estimatedMinutes: z.number().int().min(1).max(30),
      completionCriteria: z.string(), realUserContact: z.boolean(),
    })).min(1).max(3).refine((items) => items.some((item) => item.realUserContact), "至少一项行动需要接触真实用户"),
    badge: z.literal("开局行动者"),
  }),
  assumptions: z.array(z.string()).max(6),
  closing: z.string(),
});

export type HerStartAnalysis = z.infer<typeof analysisSchema>;
