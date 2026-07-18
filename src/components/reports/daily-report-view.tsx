import type { PublicDailyReport } from "@/lib/types";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

function Distribution({
  title,
  values,
}: {
  title: string;
  values: Record<string, number>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(values).map(([label, value]) => (
          <span
            key={label}
            className="rounded-full bg-orange-50 px-3 py-1.5 text-sm text-orange-900"
          >
            {label} {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-bold text-stone-900">{children}</h2>
    </div>
  );
}

export function DailyReportView({ report }: { report: PublicDailyReport }) {
  const stats = [
    ["今日采集", report.totalCollected],
    ["入选情报", report.totalSelected],
    ["推荐关注", report.totalRecommended],
    ["高风险提醒", report.totalHighRisk],
    ["适合宝妈", report.trendAnalysis.audiences["宝妈"] ?? 0],
    ["AI可辅助机会", report.totalAiAssisted],
  ] as const;

  return (
    <main className="mx-auto max-w-4xl px-4 py-4 pb-16 sm:px-6 sm:py-8">
      <header className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-amber-500 to-rose-400 p-6 text-white shadow-xl shadow-orange-200/50 sm:p-10">
        <p className="text-sm font-semibold text-orange-50">
          {report.reportDate} · 每日更新
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
          {report.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-orange-50 sm:text-base">
          {report.subtitle}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["今日采集", report.totalCollected],
            ["入选情报", report.totalSelected],
            ["推荐关注", report.totalRecommended],
            ["高风险提醒", report.totalHighRisk],
            ["低门槛机会", report.totalLowBarrier],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-xs text-orange-50">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="mt-6">
        <SectionTitle eyebrow="Daily Snapshot">今日概览</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(([label, value]) => (
            <Stat key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      {report.jennyDailyComment?.trim() ? (
        <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-bold text-amber-800">珍妮今日观察</p>
          <p className="mt-2 leading-7 text-stone-800">
            {report.jennyDailyComment}
          </p>
        </section>
      ) : null}

      <section className="mt-10">
        <SectionTitle eyebrow="Top 10">今日Top机会榜单</SectionTitle>
        <div className="mt-5 space-y-4">
          {report.items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-stone-900 text-lg font-black text-white">
                  {item.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-900 sm:text-xl">
                      {item.title}
                    </h3>
                    {item.jennyRecommended ? (
                      <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">
                        珍妮推荐
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {[item.opportunityType, ...item.audiences, item.skillLevel,
                      item.timeRequirement, `风险${item.riskLevel}`]
                      .filter(Boolean)
                      .map((tag) => (
                        <span key={tag} className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-black text-orange-600">{item.score}</p>
                  <p className="text-[11px] text-stone-500">推荐指数</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                <p className="text-xs font-bold text-stone-500">AI分析摘要</p>
                <p className="mt-2 leading-7 text-stone-800">{item.aiSummary}</p>
                <p className="mt-2 text-sm text-orange-800">
                  入选理由：{item.reasonForSelection}
                </p>
              </div>
              <div className="mt-4 border-l-4 border-orange-400 pl-4">
                <p className="text-xs font-bold text-stone-500">今日行动建议</p>
                <p className="mt-1 leading-7 text-stone-800">{item.actionStep}</p>
              </div>
              {item.jennyComment?.trim() ? (
                <div className="mt-4 rounded-2xl bg-orange-50 p-4">
                  <p className="text-sm font-bold text-orange-800">珍妮点评</p>
                  <p className="mt-2 leading-7 text-stone-800">
                    {item.jennyComment}
                  </p>
                </div>
              ) : null}
              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                <span className="text-xs text-stone-500">来源：{item.source}</span>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-sm font-semibold text-orange-700"
                >
                  查看原文 →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-stone-200 bg-white p-6">
        <SectionTitle eyebrow="Trend">今日趋势分析</SectionTitle>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <Distribution title="机会类型分布" values={report.trendAnalysis.opportunityTypes} />
          <Distribution title="适合人群分布" values={report.trendAnalysis.audiences} />
          <Distribution title="风险等级分布" values={report.trendAnalysis.riskLevels} />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["今日观察", report.trendAnalysis.observations],
            ["值得关注", report.trendAnalysis.focusDirections],
            ["避坑提醒", report.trendAnalysis.riskWarnings],
          ].map(([title, lines]) => (
            <div key={title as string} className="rounded-2xl bg-stone-50 p-4">
              <h3 className="font-bold text-stone-900">{title}</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-600">
                {(lines as string[]).map((line) => <li key={line}>· {line}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle eyebrow="Take Action">今日行动建议</SectionTitle>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["想找工作", report.actionSuggestions.jobSeeker],
            ["全职宝妈", report.actionSuggestions.fullTimeMom],
            ["想做副业", report.actionSuggestions.sideHustle],
            ["用AI提效", report.actionSuggestions.aiEfficiency],
          ].map(([title, content]) => (
            <div key={title} className="rounded-2xl border border-orange-100 bg-white p-5">
              <h3 className="font-bold text-stone-900">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">{content}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 rounded-3xl bg-stone-900 p-6 text-stone-300">
        <p className="text-sm leading-7">
          免责声明：本平台提供职业机会信息分析和学习参考，不直接提供招聘撮合，
          不承诺收入结果，用户需自行判断风险。
        </p>
        <a
          href="/opportunities"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-semibold text-stone-900"
        >
          查看全部机会库
        </a>
      </footer>
    </main>
  );
}
