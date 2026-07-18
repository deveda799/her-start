import { NextResponse } from "next/server";
import { handleReportByDateRequest } from "@/lib/api/reports-route-handlers";
import { parseRuntimeEnv } from "@/lib/config/env";
import { createOpportunityDataProvider } from "@/lib/providers/provider-factory";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params;
    const env = parseRuntimeEnv(process.env, "web");
    const provider = await createOpportunityDataProvider(env);
    return await handleReportByDateRequest(date, provider);
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Unknown daily report API error",
    );
    return NextResponse.json(
      { error: "暂时无法获取日报" },
      { status: 500 },
    );
  }
}
