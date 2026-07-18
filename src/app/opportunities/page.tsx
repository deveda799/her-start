import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import {
  buildOpportunityUrl,
  OpportunityFilters,
} from "@/components/opportunities/opportunity-filters";
import { headers } from "next/headers";
import {
  fetchOpportunityList,
  getRequestOrigin,
} from "@/lib/api/opportunities-api-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1);
  const query = {
    page,
    pageSize: 20,
    type: first(params.type),
    tag: first(params.tag),
    risk: first(params.risk),
    keyword: first(params.keyword),
  };

  let result;
  let errorMessage: string | null = null;
  try {
    result = await fetchOpportunityList(
      query,
      fetch,
      getRequestOrigin(await headers()),
    );
  } catch {
    errorMessage = "暂时无法加载情报，请稍后再试。";
    result = { items: [], hasMore: false, total: 0, page, pageSize: 20 };
  }

  return (
    <main className="mx-auto max-w-5xl p-4 pb-12 sm:p-6">
      <header className="py-6">
        <p className="text-sm font-medium text-amber-700">每日审核更新</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          珍妮职业机会情报
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          面向35+女性、宝妈和职场转型者，提供经过人工审核的工作、副业和AI提效信息。
        </p>
      </header>

      <OpportunityFilters query={query} />

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          {errorMessage}
        </div>
      ) : result.items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          暂无符合条件的已发布情报。
        </div>
      ) : (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {result.items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </section>
      )}

      <nav className="mt-8 flex items-center justify-between" aria-label="分页">
        {page > 1 ? (
          <a
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-white px-4"
            href={buildOpportunityUrl(query, { page: page - 1 })}
          >
            上一页
          </a>
        ) : <span />}
        {result.hasMore ? (
          <a
            className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-4 text-white"
            href={buildOpportunityUrl(query, { page: page + 1 })}
          >
            下一页
          </a>
        ) : <span />}
      </nav>
    </main>
  );
}
