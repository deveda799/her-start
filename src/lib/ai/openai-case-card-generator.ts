import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AIClient } from "./ai-client";
import type { CaseCard, RawItem } from "@/lib/types";
import {
  aiCaseCardSchema,
  caseCardSystemPrompt,
  parseCaseCard,
} from "./case-card-schema";

export class OpenAIClient implements AIClient {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async generateCaseCard(item: RawItem): Promise<CaseCard> {
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: "system", content: caseCardSystemPrompt },
        { role: "user", content: JSON.stringify(item) },
      ],
      text: {
        format: zodTextFormat(aiCaseCardSchema, "career_case_card"),
      },
    });
    if (!response.output_parsed) {
      throw new Error("OpenAI returned no structured case card");
    }
    return parseCaseCard(response.output_parsed, item, this.now);
  }
}
