export function DailyReportEmpty() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-16">
      <section className="w-full rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-100 text-2xl">
          🗞️
        </div>
        <h1 className="mt-5 text-2xl font-bold text-stone-900">
          今日情报正在整理中，请稍后查看。
        </h1>
        <p className="mt-3 leading-7 text-stone-600">
          我们正在筛选适合35+女性、宝妈和职场转型者的职业机会。
        </p>
        <a
          href="/opportunities"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-stone-900 px-5 font-medium text-white"
        >
          查看全部机会库
        </a>
      </section>
    </main>
  );
}
