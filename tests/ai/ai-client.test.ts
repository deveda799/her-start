import { describe, expect, it, vi } from "vitest";
import { createAIClient } from "@/lib/ai/ai-client";
import { DeepSeekAIClient } from "@/lib/ai/deepseek-ai-client";
import { OpenAIClient } from "@/lib/ai/openai-case-card-generator";
import type { RawItem } from "@/lib/types";

const rawItem: RawItem = {
  title: "原始标题",
  url: "https://example.com/opportunity",
  summary: "公开内容摘要",
  source: "公开来源",
  publishedAt: "2026-06-28T00:00:00.000Z",
  sourceId: "manual",
  sourceType: "manual",
};

const validAiPayload = {
  title: "35+女性远程顾问机会",
  opportunityType: "工作机会",
  audiences: ["35+女性", "职场转型者"],
  timeRequirement: "每周约10小时",
  skillThreshold: "项目管理经验",
  riskLevel: "低",
  aiAssistance: "AI可辅助整理方案和会议纪要",
  summary: "从小项目开始验证顾问服务。",
  jennyComment: "投入可控，适合从已有经验切入。",
  actionSuggestion: "今天列出三个可提供的顾问服务。",
  tags: ["远程", "顾问"],
  scoreBreakdown: {
    audienceFit: 25,
    painStrength: 20,
    actionability: 20,
    timeliness: 10,
    riskControl: 8,
  },
  riskReason: "需要核实合作方和付款条款。",
};

describe("AIClient", () => {
  it("creates the selected provider", () => {
    expect(createAIClient({
      provider: "deepseek",
      apiKey: "test",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
    })).toBeInstanceOf(DeepSeekAIClient);

    expect(createAIClient({
      provider: "openai",
      apiKey: "test",
      model: "gpt-5.4-mini",
    })).toBeInstanceOf(OpenAIClient);
  });

  it("requests JSON output from DeepSeek and parses the case card", async () => {
    const create = vi.fn(async () => ({
      choices: [{ message: { content: JSON.stringify(validAiPayload) } }],
    }));
    const client = new DeepSeekAIClient(
      {
        apiKey: "test",
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
      },
      { chat: { completions: { create } } },
      () => new Date("2026-06-30T00:00:00.000Z"),
    );

    const card = await client.generateCaseCard(rawItem);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: "deepseek-v4-flash",
      response_format: { type: "json_object" },
      stream: false,
    }));
    expect(card.score).toBe(83);
    expect(card.createdAt).toBe("2026-06-30T00:00:00.000Z");
  });

  it("rejects an empty DeepSeek response", async () => {
    const client = new DeepSeekAIClient(
      {
        apiKey: "test",
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
      },
      {
        chat: {
          completions: {
            create: vi.fn(async () => ({
              choices: [{ message: { content: null } }],
            })),
          },
        },
      },
    );

    await expect(client.generateCaseCard(rawItem))
      .rejects.toThrow("DeepSeek returned no case card content");
  });

  it("rejects non-JSON DeepSeek output", async () => {
    const client = new DeepSeekAIClient(
      {
        apiKey: "test",
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-v4-flash",
      },
      {
        chat: {
          completions: {
            create: vi.fn(async () => ({
              choices: [{ message: { content: "not-json" } }],
            })),
          },
        },
      },
    );

    await expect(client.generateCaseCard(rawItem)).rejects.toBeInstanceOf(SyntaxError);
  });
});
