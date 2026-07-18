import Link from "next/link";
import type { PublicOpportunity } from "@/lib/types";

export function OpportunityCard({
  opportunity,
}: {
  opportunity: PublicOpportunity;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
          {opportunity.opportunityType}
        </span>
        <span className={`rounded-full px-3 py-1 ${
          opportunity.riskLevel === "高"
            ? "bg-red-50 text-red-700"
            : "bg-emerald-50 text-emerald-700"
        }`}>
          {opportunity.riskLevel}风险
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
          评分 {opportunity.score}
        </span>
      </div>
      <h2 className="text-xl font-semibold leading-8 text-stone-900">
        {opportunity.title}
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        适合：{opportunity.audiences.join("、") || "待确认"}
      </p>
      <p className="mt-4 line-clamp-3 flex-1 text-base leading-7 text-stone-700">
        {opportunity.summary}
      </p>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-stone-100 pt-4">
        <div className="text-sm leading-6 text-stone-500">
          <div>{opportunity.source}</div>
          <div>{opportunity.publishedDate ?? "日期待确认"}</div>
        </div>
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          查看详情
        </Link>
      </div>
    </article>
  );
}
