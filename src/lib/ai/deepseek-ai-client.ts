import OpenAI from "openai";
import type { AIClient } from "./ai-client";
import {
  caseCardSystemPrompt,
  parseCaseCard,
} from "./case-card-schema";
import type { CaseCard, RawItem } from "@/lib/types";

export interface DeepSeekAIClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface DeepSeekCompletionRequest {
  model: string;
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
  response_format: { type: "json_object" };
  stream: false;
}

interface DeepSeekCompatibleClient {
  chat: {
    completions: {
      create(request: DeepSeekCompletionRequest): Promise<{
        choices: Array<{
          message: {
            content: string | null;
          };
        }>;
      }>;
    };
  };
}

export class DeepSeekAIClient implements AIClient {
  private readonly client: DeepSeekCompatibleClient;

  constructor(
    private readonly config: DeepSeekAIClientConfig,
    client?: DeepSeekCompatibleClient,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.client = client ?? new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    }) as unknown as DeepSeekCompatibleClient;
  }

  async generateCaseCard(item: RawItem): Promise<CaseCard> {
    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `${caseCardSystemPrompt}\n只输出 JSON。`,
        },
        { role: "user", content: JSON.stringify(item) },
      ],
      response_format: { type: "json_object" },
      stream: false,
    });
    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error("DeepSeek returned no case card content");
    }
    return parseCaseCard(JSON.parse(content), item, this.now);
  }
}
