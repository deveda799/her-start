import type {
  OpportunityListResult,
  OpportunityQuery,
} from "@/lib/providers/contracts";
import type { PublicOpportunity } from "@/lib/types";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

interface HeaderReader {
  get(name: string): string | null;
}

export function getRequestOrigin(headers: HeaderReader): string {
  const internalOrigin = process.env.INTERNAL_API_ORIGIN?.trim();
  if (internalOrigin) return internalOrigin.replace(/\/+$/, "");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) throw new Error("Request host is unavailable");
  const protocol = headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

function listUrl(query: OpportunityQuery, origin: string): string {
  const url = new URL("/api/opportunities", origin);
  url.searchParams.set("page", String(query.page));
  url.searchParams.set("pageSize", String(query.pageSize));
  if (query.tag) url.searchParams.set("tag", query.tag);
  if (query.type) url.searchParams.set("type", query.type);
  if (query.risk) url.searchParams.set("risk", query.risk);
  if (query.keyword) url.searchParams.set("keyword", query.keyword);
  return url.toString();
}

export async function fetchOpportunityList(
  query: OpportunityQuery,
  fetchImpl: FetchLike = fetch,
  origin: string,
): Promise<OpportunityListResult> {
  const response = await fetchImpl(listUrl(query, origin), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Opportunities API failed: ${response.status}`);
  return response.json() as Promise<OpportunityListResult>;
}

export async function fetchOpportunityDetail(
  id: string,
  fetchImpl: FetchLike = fetch,
  origin: string,
): Promise<PublicOpportunity | null> {
  const response = await fetchImpl(
    new URL(`/api/opportunities/${encodeURIComponent(id)}`, origin).toString(),
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Opportunity detail API failed: ${response.status}`);
  }
  return response.json() as Promise<PublicOpportunity>;
}
