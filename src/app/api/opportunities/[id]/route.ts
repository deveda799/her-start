import { NextResponse } from "next/server";
import { parseRuntimeEnv } from "@/lib/config/env";
import { handleDetailRequest } from "@/lib/api/opportunities-route-handlers";
import { createOpportunityDataProvider } from "@/lib/providers/provider-factory";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const env = parseRuntimeEnv(process.env, "web");
    const provider = await createOpportunityDataProvider(env);
    return await handleDetailRequest(id, provider);
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Unknown opportunity detail API error",
    );
    return NextResponse.json(
      { error: "暂时无法获取情报" },
      { status: 500 },
    );
  }
}
