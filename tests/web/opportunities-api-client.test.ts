import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchOpportunityDetail,
  fetchOpportunityList,
  getRequestOrigin,
} from "@/lib/api/opportunities-api-client";

describe("H5 opportunities API client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the internal API origin during self-hosting", () => {
    vi.stubEnv("INTERNAL_API_ORIGIN", "http://127.0.0.1:3000");

    expect(getRequestOrigin({
      get: () => "175.178.174.40",
    })).toBe("http://127.0.0.1:3000");
  });

  it("requests the Next.js list API with filters", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    })));

    await fetchOpportunityList({
      page: 1,
      pageSize: 20,
      keyword: "顾问",
    }, fetchImpl, "https://example.test");

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://example.test/api/opportunities?",
      ),
      expect.any(Object),
    );
  });

  it("requests the Next.js detail API", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      id: "row-1",
    })));

    await fetchOpportunityDetail(
      "row-1",
      fetchImpl,
      "https://example.test",
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.test/api/opportunities/row-1",
      expect.any(Object),
    );
  });
});
