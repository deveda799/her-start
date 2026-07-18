import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseRuntimeEnv } from "@/lib/config/env";
import { handleListRequest } from "@/lib/api/opportunities-route-handlers";
import { createOpportunityDataProvider } from "@/lib/providers/provider-factory";

export async function GET(request: NextRequest) {
  try {
    const env = parseRuntimeEnv(process.env, "web");
    const provider = await createOpportunityDataProvider(env);
    return await handleListRequest(request, provider);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Unknown opportunities API error",
    );
    return NextResponse.json(
      { error: "暂时无法获取情报" },
      { status: 500 },
    );
  }
}
