import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  fetchOpportunityDetail,
  getRequestOrigin,
} from "@/lib/api/opportunities-api-client";

export const dynamic = "force-dynamic";

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="border-b border-stone-100 py-4">
      <dt className="text-sm font-medium text-stone-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-base leading-7 text-stone-800">
        {value || "待确认"}
      </dd>
    </div>
  );
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opportunity = await fetchOpportunityDetail(
    id,
    fetch,
    getRequestOrigin(await headers()),
  );
  if (!opportunity) notFound();

  return (
    <main className="mx-auto max-w-3xl p-4 pb-12 sm:p-6">
      <a href="/opportunities" className="inline-flex min-h-11 items-center text-stone-600">
        ← 返回机会列表
      </a>
      <article className="mt-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
            {opportunity.opportunityType}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            {opportunity.riskLevel}风险
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            评分 {opportunity.score}
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-stone-900">
          {opportunity.title}
        </h1>
        {opportunity.riskLevel === "高" && (
          <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-800">
            高风险提醒：请核实主体、合同和付款方式，不要预付不明费用。
          </p>
        )}
        <dl className="mt-6">
          <Detail label="适合人群" value={opportunity.audiences.join("、")} />
          <Detail label="时间要求" value={opportunity.timeRequirement} />
          <Detail label="技能门槛" value={opportunity.skillThreshold} />
          <Detail label="AI可辅助点" value={opportunity.aiAssistance} />
          <Detail label="案例摘要" value={opportunity.summary} />
          <Detail label="珍妮点评" value={opportunity.jennyComment} />
          <Detail label="今日行动建议" value={opportunity.actionSuggestion} />
          <Detail label="发布日期" value={opportunity.publishedDate} />
          <Detail label="来源" value={opportunity.source} />
          <Detail label="标签" value={opportunity.tags.join("、")} />
        </dl>
        <a
          href={opportunity.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 font-medium text-white"
        >
          查看原文（外部链接）
        </a>
      </article>
    </main>
  );
}
