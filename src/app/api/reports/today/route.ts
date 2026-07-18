import { NextResponse } from "next/server";
import { handleTodayReportRequest } from "@/lib/api/reports-route-handlers";
import { parseRuntimeEnv } from "@/lib/config/env";
import { createOpportunityDataProvider } from "@/lib/providers/provider-factory";

export async function GET() {
  try {
    const env = parseRuntimeEnv(process.env, "web");
    const provider = await createOpportunityDataProvider(env);
    return await handleTodayReportRequest(provider);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Unknown daily report API error",
    );
    return NextResponse.json(null, { status: 500 });
  }
}
