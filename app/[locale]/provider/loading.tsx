export default function ProviderLoading() {
  return (
    <div className="min-h-[70dvh] animate-pulse space-y-6 motion-reduce:animate-none">
      <div className="h-12 w-72 rounded-xl bg-black/10" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-64 rounded-[28px] bg-white shadow-sm" />
        <div className="h-64 rounded-[28px] bg-lavender-whisper/60" />
      </div>
      <div className="h-56 rounded-[28px] bg-white shadow-sm" />
    </div>
  );
}
