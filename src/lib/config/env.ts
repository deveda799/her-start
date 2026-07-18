import { z } from "zod";

export type RuntimeMode = "collect-dry" | "collect" | "web";

const positiveInt = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

const envSchema = z.object({
  DATA_PROVIDER: z.enum(["supabase", "local-json"]).default("supabase"),
  LOCAL_JSON_DATA_PATH: z.string().min(1)
    .default("output/local-opportunities.json"),
  AI_PROVIDER: z.enum(["deepseek", "openai"]).default("deepseek"),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().min(1).default("deepseek-v4-flash"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.4-mini"),
  BRAVE_SEARCH_API_KEY: z.string().min(1).optional(),
  MAX_DAILY_SEARCH_QUERIES: positiveInt(30),
  MAX_ITEMS_PER_RUN: positiveInt(50),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export function parseRuntimeEnv(
  input: NodeJS.ProcessEnv | Record<string, string | undefined>,
  mode: RuntimeMode,
) {
  const parsed = envSchema.parse(input);

  const requireKeys = (keys: (keyof typeof parsed)[]) => {
    for (const key of keys) {
      if (!parsed[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  };

  if (mode === "collect-dry" || mode === "collect") {
    if (parsed.AI_PROVIDER === "deepseek" && !parsed.DEEPSEEK_API_KEY) {
      throw new Error("AI_PROVIDER=deepseek requires DEEPSEEK_API_KEY");
    }
    if (parsed.AI_PROVIDER === "openai" && !parsed.OPENAI_API_KEY) {
      throw new Error("AI_PROVIDER=openai requires OPENAI_API_KEY");
    }
  }
  if (mode === "collect") {
    if (parsed.DATA_PROVIDER === "supabase") {
      requireKeys(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    }
  }
  if (mode === "web" && parsed.DATA_PROVIDER === "supabase") {
    requireKeys(["SUPABASE_URL"]);
    if (!parsed.SUPABASE_ANON_KEY && !parsed.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "DATA_PROVIDER=supabase requires SUPABASE_ANON_KEY "
        + "or SUPABASE_SERVICE_ROLE_KEY for web reads",
      );
    }
  }

  return {
    dataProvider: parsed.DATA_PROVIDER,
    localJsonDataPath: parsed.LOCAL_JSON_DATA_PATH,
    aiProvider: parsed.AI_PROVIDER,
    deepseekApiKey: parsed.DEEPSEEK_API_KEY,
    deepseekBaseUrl: parsed.DEEPSEEK_BASE_URL,
    deepseekModel: parsed.DEEPSEEK_MODEL,
    openaiApiKey: parsed.OPENAI_API_KEY,
    openaiModel: parsed.OPENAI_MODEL,
    braveSearchApiKey: parsed.BRAVE_SEARCH_API_KEY,
    maxDailySearchQueries: parsed.MAX_DAILY_SEARCH_QUERIES,
    maxItemsPerRun: parsed.MAX_ITEMS_PER_RUN,
    supabaseUrl: parsed.SUPABASE_URL,
    supabaseAnonKey: parsed.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export type RuntimeEnv = ReturnType<typeof parseRuntimeEnv>;
