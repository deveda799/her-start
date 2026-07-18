import { describe, expect, it, vi } from "vitest";
import {
  handleReportByDateRequest,
  handleTodayReportRequest,
} from "@/lib/api/reports-route-handlers";
import type { OpportunityDataProvider } from "@/lib/providers/contracts";

function provider(): OpportunityDataProvider {
  return {
    listPublicOpportunities: vi.fn(),
    getPublicOpportunity: vi.fn(),
    getLatestPublicDailyReport: vi.fn(async () => null),
    getPublicDailyReportByDate: vi.fn(async () => null),
  };
}

describe("daily report API", () => {
  it("uses the Shanghai date and falls back through the provider", async () => {
    const dataProvider = provider();

    const response = await handleTodayReportRequest(
      dataProvider,
      new Date("2026-07-01T17:00:00.000Z"),
    );

    expect(response.status).toBe(200);
    expect(dataProvider.getLatestPublicDailyReport)
      .toHaveBeenCalledWith("2026-07-02");
    expect(await response.json()).toBeNull();
  });

  it("rejects invalid dates and returns 404 for an unpublished date", async () => {
    const dataProvider = provider();

    const invalid = await handleReportByDateRequest("2026-7-2", dataProvider);
    const missing = await handleReportByDateRequest("2026-07-02", dataProvider);

    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
    expect(dataProvider.getPublicDailyReportByDate)
      .toHaveBeenCalledWith("2026-07-02");
  });
});
