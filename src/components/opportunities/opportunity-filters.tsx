import Link from "next/link";

export interface FilterQuery {
  type?: string;
  tag?: string;
  risk?: string;
  keyword?: string;
  page?: number;
}

export function buildOpportunityUrl(
  current: FilterQuery,
  updates: Partial<FilterQuery>,
): string {
  const merged = { ...current, ...updates, page: updates.page ?? 1 };
  const params = new URLSearchParams();
  if (merged.type) params.set("type", merged.type);
  if (merged.tag) params.set("tag", merged.tag);
  if (merged.risk) params.set("risk", merged.risk);
  if (merged.keyword) params.set("keyword", merged.keyword);
  params.set("page", String(merged.page ?? 1));
  const query = params.toString();
  return query ? `/opportunities?${query}` : "/opportunities";
}

export function OpportunityFilters({ query }: { query: FilterQuery }) {
  return (
    <form
      action="/opportunities"
      method="get"
      className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-5"
    >
      <label className="grid gap-1 text-sm font-medium text-stone-700">
        机会类型
        <select
          name="type"
          defaultValue={query.type ?? ""}
          className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-base"
        >
          <option value="">全部</option>
          <option>工作机会</option>
          <option>副业案例</option>
          <option>AI提效</option>
          <option>灵活就业</option>
          <option>避坑</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-stone-700">
        标签
        <select
          name="tag"
          defaultValue={query.tag ?? ""}
          className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-base"
        >
          <option value="">全部</option>
          <option>远程</option>
          <option>宝妈</option>
          <option>35+女性</option>
          <option>职场转型</option>
          <option>AI工具</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-stone-700">
        风险等级
        <select
          name="risk"
          defaultValue={query.risk ?? ""}
          className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-base"
        >
          <option value="">全部</option>
          <option>低</option>
          <option>中</option>
          <option>高</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-stone-700">
        关键词
        <input
          name="keyword"
          defaultValue={query.keyword ?? ""}
          placeholder="岗位、技能或主题"
          className="min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-base"
        />
      </label>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="min-h-11 flex-1 rounded-xl bg-stone-900 px-4 text-base font-medium text-white"
        >
          筛选
        </button>
        <Link
          href="/opportunities"
          className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-3 text-sm text-stone-700"
        >
          清除筛选
        </Link>
      </div>
    </form>
  );
}
