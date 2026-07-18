export default function OpportunitiesLoading() {
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="h-10 w-64 animate-pulse rounded bg-stone-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-72 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    </main>
  );
}
