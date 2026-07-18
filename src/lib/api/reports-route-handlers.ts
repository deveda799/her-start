import { NextResponse } from "next/server";
import type { OpportunityDataProvider } from "@/lib/providers/contracts";
import { getShanghaiDate } from "@/lib/report/daily-report";

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function handleTodayReportRequest(
  provider: OpportunityDataProvider,
  now: Date = new Date(),
): Promise<NextResponse> {
  const report = await provider.getLatestPublicDailyReport(
    getShanghaiDate(now),
  );
  return NextResponse.json(report, { headers: cacheHeaders });
}

export async function handleReportByDateRequest(
  date: string,
  provider: OpportunityDataProvider,
): Promise<NextResponse> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式应为 YYYY-MM-DD" }, {
      status: 400,
    });
  }
  const report = await provider.getPublicDailyReportByDate(date);
  if (!report) {
    return NextResponse.json({ error: "该日期暂无已发布日报" }, {
      status: 404,
    });
  }
  return NextResponse.json(report, { headers: cacheHeaders });
}
