import type { CaseCard } from "@/lib/types";
import { caseCardToFeishuFields } from "./fields";

const FEISHU_BASE_URL = "https://open.feishu.cn/open-apis";

export interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
}

interface FeishuResponse {
  code: number;
  msg?: string;
  data?: {
    items?: FeishuRecord[];
    has_more?: boolean;
    page_token?: string;
    records?: FeishuRecord[];
  };
  tenant_access_token?: string;
}

export function extractOriginalUrl(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "link" in value) {
    const link = (value as { link?: unknown }).link;
    return typeof link === "string" ? link : null;
  }
  return null;
}

export class FeishuClient {
  private accessToken: string | null = null;

  constructor(
    private readonly config: FeishuConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    const response = await this.fetchImpl(
      `${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const body = await this.parseResponse(response);
    if (!body.tenant_access_token) {
      throw new Error("Feishu authentication returned no tenant access token");
    }
    this.accessToken = body.tenant_access_token;
    return this.accessToken;
  }

  private async parseResponse(response: Response): Promise<FeishuResponse> {
    if (!response.ok) {
      throw new Error(`Feishu request failed with status ${response.status}`);
    }
    const body = await response.json() as FeishuResponse;
    if (body.code !== 0) {
      throw new Error(`Feishu API error ${body.code}: ${body.msg ?? "unknown error"}`);
    }
    return body;
  }

  private recordsUrl(): string {
    return `${FEISHU_BASE_URL}/bitable/v1/apps/${encodeURIComponent(this.config.appToken)}`
      + `/tables/${encodeURIComponent(this.config.tableId)}/records`;
  }

  async listAllRecords(): Promise<FeishuRecord[]> {
    const token = await this.getAccessToken();
    const records: FeishuRecord[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(this.recordsUrl());
      url.searchParams.set("page_size", "500");
      if (pageToken) url.searchParams.set("page_token", pageToken);
      const response = await this.fetchImpl(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        signal: AbortSignal.timeout(15_000),
      });
      const body = await this.parseResponse(response);
      records.push(...(body.data?.items ?? []));
      pageToken = body.data?.has_more ? body.data.page_token : undefined;
    } while (pageToken);

    return records;
  }

  async batchCreate(cards: CaseCard[]): Promise<number> {
    if (cards.length === 0) return 0;
    const token = await this.getAccessToken();
    const response = await this.fetchImpl(`${this.recordsUrl()}/batch_create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        records: cards.map((card) => ({ fields: caseCardToFeishuFields(card) })),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = await this.parseResponse(response);
    return body.data?.records?.length ?? cards.length;
  }
}
