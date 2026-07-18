import type { OpportunityQuery } from "./contracts";

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalValue(
  params: URLSearchParams,
  key: string,
): string | undefined {
  const value = params.get(key)?.trim();
  return value || undefined;
}

export function parseOpportunityQuery(
  params: URLSearchParams,
): OpportunityQuery {
  return {
    page: positiveInt(params.get("page"), 1),
    pageSize: Math.min(50, positiveInt(params.get("pageSize"), 20)),
    tag: optionalValue(params, "tag"),
    type: optionalValue(params, "type"),
    risk: optionalValue(params, "risk"),
    keyword: optionalValue(params, "keyword"),
  };
}
