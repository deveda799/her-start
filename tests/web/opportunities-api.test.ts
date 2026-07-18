import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { handleListRequest } from "@/lib/api/opportunities-route-handlers";
import { parseOpportunityQuery } from "@/lib/providers/query";
import type { OpportunityDataProvider } from "@/lib/providers/contracts";

describe("opportunities list API", () => {
  it("uses safe pagination defaults and caps page size", () => {
    expect(parseOpportunityQuery(new URLSearchParams())).toMatchObject({
      page: 1,
      pageSize: 20,
    });
    expect(parseOpportunityQuery(new URLSearchParams("page=0&pageSize=999")))
      .toMatchObject({ page: 1, pageSize: 50 });
  });

  it("forwards filters to OpportunityDataProvider", async () => {
    const listPublicOpportunities = vi.fn(async () => ({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    }));
    const provider = {
      listPublicOpportunities,
      getPublicOpportunity: vi.fn(),
      getLatestPublicDailyReport: vi.fn(),
      getPublicDailyReportByDate: vi.fn(),
    } satisfies OpportunityDataProvider;
    const request = new NextRequest(
      "https://example.test/api/opportunities"
      + "?tag=远程&type=工作机会&risk=低&keyword=顾问",
    );

    const response = await handleListRequest(request, provider);

    expect(response.status).toBe(200);
    expect(listPublicOpportunities).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      tag: "远程",
      type: "工作机会",
      risk: "低",
      keyword: "顾问",
    });
  });
});
