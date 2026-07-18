import type { CaseCard, RawItem } from "@/lib/types";
import { DeepSeekAIClient } from "./deepseek-ai-client";
import { OpenAIClient } from "./openai-case-card-generator";

export interface AIClient {
  generateCaseCard(item: RawItem): Promise<CaseCard>;
}

export type AIClientConfig =
  | {
      provider: "deepseek";
      apiKey: string;
      baseUrl: string;
      model: string;
    }
  | {
      provider: "openai";
      apiKey: string;
      model: string;
    };

export function createAIClient(config: AIClientConfig): AIClient {
  if (config.provider === "deepseek") {
    return new DeepSeekAIClient(config);
  }
  return new OpenAIClient(config.apiKey, config.model);
}
