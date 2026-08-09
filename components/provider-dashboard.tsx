"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  LoaderCircle,
  LogOut,
} from "lucide-react";

import { Link, useRouter } from "@/i18n/navigation";

type DashboardCopy = {
  checking: string;
  eyebrow: string;
  title: string;
  welcome: string;
  bookingPage: string;
  live: string;
  viewPage: string;
  copyLink: string;
  copied: string;
  settings: string;
  duration: string;
  notice: string;
  rest: string;
  timeZone: string;
  minutes: string;
  signOut: string;
};

type ProviderData = {
  profile: {
    displayName: string;
    professionalTitle: string;
    timeZone: string;
    defaultAppointmentDurationMinutes: number;
    minimumBookingNoticeMinutes: number;
    restBetweenSessionsMinutes: number;
  };
  bookingPage: { slug: string };
};

export function ProviderDashboard({ copy }: { copy: DashboardCopy }) {
  const router = useRouter();
  const [data, setData] = useState<ProviderData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const jwt = await mintAccessToken();

      if (!jwt) {
        router.replace("/auth/provider");
        return;
      }

      const response = await fetch("/api/provider", {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });

      if (!response.ok) {
        router.replace("/auth/provider");
        return;
      }

      const body = (await response.json()) as ProviderData & {
        status: "active" | "setup_required";
      };

      if (body.status !== "active" || !body.profile || !body.bookingPage) {
        router.replace("/auth/provider");
        return;
      }

      if (!cancelled) setData(body);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function copyBookingLink() {
    if (!data) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/book/${data.bookingPage.slug}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function signOut() {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Pass an empty JSON object
    });
    router.replace("/auth/provider");
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-lumen-cream">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
          {copy.checking}
        </div>
      </main>
    );
  }

  const bookingPath = `/book/${data.bookingPage.slug}`;

  return (
    <main className="min-h-screen bg-lumen-cream px-4 py-6 text-vast-ink sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-full border-2 border-vast-ink bg-white py-2 pr-3 pl-5">
          <Link
            className="inline-flex items-center gap-2 text-lg font-bold"
            href="/"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-ember-glow text-sm">
              P
            </span>
            PeerSlot
          </Link>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-full border-2 border-vast-ink px-4 text-sm font-semibold hover:bg-lumen-stone"
            onClick={signOut}
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="max-sm:hidden">{copy.signOut}</span>
          </button>
        </header>

        <section className="grid gap-5 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.13em] text-[#66665e] uppercase">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-6xl leading-[0.94] tracking-[-0.04em] sm:text-7xl">
              {copy.title}
            </h1>
            <p className="mt-5 text-lg text-[#5c5c54]">
              {copy.welcome.replace("{name}", data.profile.displayName)}
            </p>
          </div>

          <article className="rounded-[28px] border-2 border-vast-ink bg-forest-ink p-6 text-lumen-cream shadow-[5px_5px_0_var(--color-vast-ink)]">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-lavender-whisper text-vast-ink">
                <CalendarClock size={21} aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lumen-cream px-3 py-2 text-[11px] font-bold text-forest-ink">
                <Check size={13} strokeWidth={3} aria-hidden="true" />{" "}
                {copy.live}
              </span>
            </div>
            <p className="mt-7 text-xs font-bold tracking-[0.12em] text-ember-glow uppercase">
              {copy.bookingPage}
            </p>
            <p className="mt-2 font-mono text-xl">{bookingPath}</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lumen-cream px-3 text-sm font-semibold text-vast-ink"
                href={bookingPath}
                target="_blank"
                rel="noreferrer"
              >
                {copy.viewPage}
                <ExternalLink size={15} aria-hidden="true" />
              </a>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#80a9a3] px-3 text-sm font-semibold"
                onClick={copyBookingLink}
                type="button"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? copy.copied : copy.copyLink}
              </button>
            </div>
          </article>
        </section>

        <section>
          <h2 className="font-display text-4xl tracking-[-0.03em]">
            {copy.settings}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SettingCard
              label={copy.duration}
              value={`${data.profile.defaultAppointmentDurationMinutes} ${copy.minutes}`}
            />
            <SettingCard
              label={copy.notice}
              value={`${data.profile.minimumBookingNoticeMinutes / 60}h`}
            />
            <SettingCard
              label={copy.rest}
              value={`${data.profile.restBetweenSessionsMinutes} ${copy.minutes}`}
            />
            <SettingCard label={copy.timeZone} value={data.profile.timeZone} />
          </div>
        </section>
      </div>
    </main>
  );
}

function SettingCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border-2 border-vast-ink bg-white p-5">
      <Clock3 size={19} className="text-forest-ink" aria-hidden="true" />
      <p className="mt-5 text-xs font-bold tracking-[0.1em] text-[#707068] uppercase">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </article>
  );
}

async function mintAccessToken() {
  const response = await fetch("/api/auth/token", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return null;
  return ((await response.json()) as { token?: string }).token ?? null;
}
