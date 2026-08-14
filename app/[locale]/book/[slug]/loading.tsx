export default function BookingPageLoading() {
  return (
    <main className="min-h-screen bg-lumen-cream px-4 py-8 text-vast-ink sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="h-8 w-28 animate-pulse rounded-full bg-black/10 motion-reduce:animate-none" />
        <div className="mt-10 grid min-h-160 overflow-hidden rounded-[32px] border-2 border-vast-ink bg-white shadow-[7px_7px_0_var(--color-vast-ink)] md:grid-cols-[0.7fr_1.3fr]">
          <section className="bg-forest-ink p-8 sm:p-10">
            <div className="size-16 animate-pulse rounded-2xl bg-white/20 motion-reduce:animate-none" />
            <div className="mt-20 h-12 w-3/4 animate-pulse rounded-xl bg-white/15 motion-reduce:animate-none" />
            <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
          </section>
          <section className="space-y-5 p-6 sm:p-10 lg:p-12">
            <div className="h-10 w-2/3 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
            {[0, 1, 2].map((item) => (
              <div
                className="h-36 animate-pulse rounded-[24px] bg-lavender-whisper/60 motion-reduce:animate-none"
                key={item}
              />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
