import type { RuntimeEnv } from "@/lib/config/env";
import type {
  OpportunityDataProvider,
  OpportunityIngestProvider,
} from "./contracts";
import { LocalJsonProvider } from "./local-json-provider";
import { SupabaseProvider } from "./supabase-provider";

export async function createOpportunityDataProvider(
  env: RuntimeEnv,
): Promise<OpportunityDataProvider> {
  if (env.dataProvider === "local-json") {
    return LocalJsonProvider.fromFile(env.localJsonDataPath);
  }
  return SupabaseProvider.forRead(
    env.supabaseUrl!,
    env.supabaseAnonKey ?? env.supabaseServiceRoleKey!,
  );
}

export async function createOpportunityIngestProvider(
  env: RuntimeEnv,
): Promise<OpportunityIngestProvider> {
  if (env.dataProvider === "local-json") {
    return LocalJsonProvider.fromFile(env.localJsonDataPath);
  }
  return SupabaseProvider.forIngest(
    env.supabaseUrl!,
    env.supabaseServiceRoleKey!,
  );
}
