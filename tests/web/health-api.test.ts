import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("health API", () => {
  it("returns deployment health metadata without credentials", async () => {
    vi.stubEnv("DATA_PROVIDER", "supabase");
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      provider: "supabase",
      environment: "production",
    });
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    expect(JSON.stringify(body)).not.toContain("KEY");
  });
});
