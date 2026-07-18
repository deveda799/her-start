import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { OpportunityDataProvider } from "@/lib/providers/contracts";
import { parseOpportunityQuery } from "@/lib/providers/query";

export async function handleListRequest(
  request: NextRequest,
  provider: OpportunityDataProvider,
): Promise<NextResponse> {
  const result = await provider.listPublicOpportunities(
    parseOpportunityQuery(request.nextUrl.searchParams),
  );
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export async function handleDetailRequest(
  id: string,
  provider: OpportunityDataProvider,
): Promise<NextResponse> {
  const opportunity = await provider.getPublicOpportunity(id);
  if (!opportunity) {
    return NextResponse.json(
      { error: "情报不存在或尚未发布" },
      { status: 404 },
    );
  }
  return NextResponse.json(opportunity, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
