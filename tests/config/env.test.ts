import { describe, expect, it } from "vitest";
import { parseRuntimeEnv } from "@/lib/config/env";

describe("parseRuntimeEnv", () => {
  it("defaults to DeepSeek and only requires its key", () => {
    const env = parseRuntimeEnv(
      { DEEPSEEK_API_KEY: "test-deepseek" },
      "collect-dry",
    );

    expect(env.aiProvider).toBe("deepseek");
    expect(env.deepseekBaseUrl).toBe("https://api.deepseek.com");
    expect(env.deepseekModel).toBe("deepseek-v4-flash");
    expect(env.dataProvider).toBe("supabase");
    expect(env.localJsonDataPath).toBe("output/local-opportunities.json");
    expect(env.openaiApiKey).toBeUndefined();
    expect(env.openaiModel).toBe("gpt-5.4-mini");
    expect(env.maxDailySearchQueries).toBe(30);
    expect(env.braveSearchApiKey).toBeUndefined();
  });

  it("requires the selected provider key with a clear error", () => {
    expect(() =>
      parseRuntimeEnv({ AI_PROVIDER: "deepseek" }, "collect-dry"),
    ).toThrow("AI_PROVIDER=deepseek requires DEEPSEEK_API_KEY");

    expect(() =>
      parseRuntimeEnv({ AI_PROVIDER: "openai" }, "collect-dry"),
    ).toThrow("AI_PROVIDER=openai requires OPENAI_API_KEY");
  });

  it("requires Supabase service credentials for Supabase collect", () => {
    expect(() =>
      parseRuntimeEnv(
        {
          AI_PROVIDER: "openai",
          OPENAI_API_KEY: "test-openai",
        },
        "collect",
      ),
    ).toThrow(/SUPABASE_URL/);
  });

  it("allows Local JSON collect without Supabase credentials", () => {
    const env = parseRuntimeEnv({
      AI_PROVIDER: "openai",
      OPENAI_API_KEY: "test-openai",
      DATA_PROVIDER: "local-json",
    }, "collect");

    expect(env.dataProvider).toBe("local-json");
  });

  it("allows Local JSON web reads without Supabase credentials", () => {
    const env = parseRuntimeEnv({
      DATA_PROVIDER: "local-json",
    }, "web");

    expect(env.localJsonDataPath).toBe("output/local-opportunities.json");
  });

  it("allows server-side Supabase reads with a service role key", () => {
    const env = parseRuntimeEnv({
      DATA_PROVIDER: "supabase",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role",
    }, "web");

    expect(env.supabaseAnonKey).toBeUndefined();
    expect(env.supabaseServiceRoleKey).toBe("test-service-role");
  });
});
