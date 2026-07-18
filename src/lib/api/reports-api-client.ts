import type { PublicDailyReport } from "@/lib/types";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export async function fetchTodayReport(
  fetchImpl: FetchLike = fetch,
  origin: string,
): Promise<PublicDailyReport | null> {
  const response = await fetchImpl(
    new URL("/api/reports/today", origin).toString(),
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(`Daily report API failed: ${response.status}`);
  }
  return response.json() as Promise<PublicDailyReport | null>;
}

export async function fetchReportByDate(
  date: string,
  fetchImpl: FetchLike = fetch,
  origin: string,
): Promise<PublicDailyReport | null> {
  const response = await fetchImpl(
    new URL(`/api/reports/${encodeURIComponent(date)}`, origin).toString(),
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Daily report API failed: ${response.status}`);
  }
  return response.json() as Promise<PublicDailyReport>;
}
