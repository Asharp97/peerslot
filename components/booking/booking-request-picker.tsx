"use client";

import {
  Check,
  LoaderCircle,
  MoonStar,
  SunMedium,
  Sunrise,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BookingSlot = {
  startsAt: string;
};

export type BookingRequestCopy = {
  morning: string;
  afternoon: string;
  evening: string;
  requestTitle: string;
  requestBody: string;
  name: string;
  email: string;
  comment: string;
  commentPlaceholder: string;
  sendRequest: string;
  sending: string;
  requestedTitle: string;
  requestedBody: string;
  requestError: string;
};

export function BookingRequestPicker({
  locale,
  slug,
  slots,
  timeZone,
  copy,
}: {
  locale: string;
  slug: string;
  slots: BookingSlot[];
  timeZone: string;
  copy: BookingRequestCopy;
}) {
  const days = useMemo(
    () => groupBookingSlots(slots, locale, timeZone),
    [locale, slots, timeZone],
  );
  const [selected, setSelected] = useState<PresentedBookingSlot | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/booking-pages/${slug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          studentEmail,
          startsAt: selected.startsAt,
          comment: comment || undefined,
        }),
      });
      if (!response.ok) throw new Error(copy.requestError);
      setRequested(true);
    } catch {
      setError(copy.requestError);
    } finally {
      setSaving(false);
    }
  }

  function close(open: boolean) {
    if (open) return;
    setSelected(null);
    setRequested(false);
    setError("");
  }

  return (
    <>
      <div className="mt-8 space-y-5">
        {days.map((day) => (
          <section
            className="overflow-hidden rounded-[24px] border border-black/10 bg-[#fbfaf4]"
            key={day.dateKey}
          >
            <header className="flex items-center gap-4 border-b border-black/8 bg-lavender-whisper/45 px-4 py-4 sm:px-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-vast-ink font-display text-3xl leading-none text-white">
                {day.day}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-2xl leading-none tracking-[-0.025em] capitalize">
                  {day.weekday}
                </h3>
                <p className="mt-1.5 text-[11px] font-bold tracking-[0.09em] text-black/45 uppercase">
                  {day.monthYear}
                </p>
              </div>
            </header>

            <div className="divide-y divide-black/8 px-4 sm:px-5">
              {day.periods.map((period) => (
                <div
                  className="grid gap-3 py-4 sm:grid-cols-[7.5rem_1fr] sm:items-start"
                  key={period.period}
                >
                  <div className="flex items-center gap-2 pt-1 text-xs font-bold text-black/45">
                    <PeriodIcon period={period.period} />
                    <span>{copy[period.period]}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {period.slots.map((slot) => (
                      <button
                        aria-label={slot.accessibleLabel}
                        className="min-h-11 min-w-22 rounded-full border border-vast-ink/15 bg-white px-4 text-center text-sm font-extrabold tabular-nums text-vast-ink transition hover:-translate-y-0.5 hover:border-vast-ink hover:bg-vast-ink hover:text-white"
                        key={slot.startsAt}
                        onClick={() => setSelected(slot)}
                        type="button"
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={close}>
        <DialogContent className="border-2 border-vast-ink bg-lumen-cream sm:max-w-lg">
          {requested ? (
            <div className="py-8 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-lavender-whisper">
                <Check size={20} />
              </span>
              <DialogTitle className="mt-5 font-display text-3xl">
                {copy.requestedTitle}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {copy.requestedBody}
              </DialogDescription>
            </div>
          ) : (
            <form onSubmit={submit}>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl">
                  {copy.requestTitle}
                </DialogTitle>
                <DialogDescription>
                  {selected?.accessibleLabel}. {copy.requestBody}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 grid gap-4">
                <div>
                  <Label className="mb-2 font-bold" htmlFor="booking-name">
                    {copy.name}
                  </Label>
                  <Input
                    autoComplete="name"
                    id="booking-name"
                    minLength={2}
                    onChange={(event) => setStudentName(event.target.value)}
                    required
                    value={studentName}
                  />
                </div>
                <div>
                  <Label className="mb-2 font-bold" htmlFor="booking-email">
                    {copy.email}
                  </Label>
                  <Input
                    autoComplete="email"
                    id="booking-email"
                    onChange={(event) => setStudentEmail(event.target.value)}
                    required
                    type="email"
                    value={studentEmail}
                  />
                </div>
                <div>
                  <Label className="mb-2 font-bold" htmlFor="booking-comment">
                    {copy.comment}
                  </Label>
                  <Textarea
                    id="booking-comment"
                    maxLength={1000}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder={copy.commentPlaceholder}
                    value={comment}
                  />
                </div>
                {error ? (
                  <p className="text-sm font-semibold text-red-700">{error}</p>
                ) : null}
              </div>
              <DialogFooter className="mt-6">
                <Button
                  className="h-11 rounded-full bg-forest-ink px-5 text-white"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? <LoaderCircle className="animate-spin" /> : null}
                  {saving ? copy.sending : copy.sendRequest}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

type TimePeriod = "morning" | "afternoon" | "evening";

type PresentedBookingSlot = BookingSlot & {
  accessibleLabel: string;
  time: string;
};

type BookingDay = {
  dateKey: string;
  day: string;
  weekday: string;
  monthYear: string;
  periods: Array<{
    period: TimePeriod;
    slots: PresentedBookingSlot[];
  }>;
};

export function groupBookingSlots(
  slots: BookingSlot[],
  locale: string,
  timeZone: string,
) {
  const days = new Map<
    string,
    Omit<BookingDay, "periods"> & Record<TimePeriod, PresentedBookingSlot[]>
  >();

  for (const slot of slots) {
    const startsAt = new Date(slot.startsAt);
    const dateParts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(startsAt);
    const values = Object.fromEntries(
      dateParts.map(({ type, value }) => [type, value]),
    );
    const dateKey = `${values.year}-${values.month}-${values.day}`;
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        hourCycle: "h23",
        timeZone,
      })
        .formatToParts(startsAt)
        .find(({ type }) => type === "hour")?.value,
    );
    const period: TimePeriod =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const presentedSlot = {
      ...slot,
      accessibleLabel: new Intl.DateTimeFormat(locale, {
        dateStyle: "full",
        timeStyle: "short",
        timeZone,
      }).format(startsAt),
      time: new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
      }).format(startsAt),
    };

    const existing = days.get(dateKey);
    if (existing) {
      existing[period].push(presentedSlot);
      continue;
    }

    days.set(dateKey, {
      dateKey,
      day: new Intl.DateTimeFormat(locale, {
        day: "numeric",
        timeZone,
      }).format(startsAt),
      weekday: new Intl.DateTimeFormat(locale, {
        timeZone,
        weekday: "long",
      }).format(startsAt),
      monthYear: new Intl.DateTimeFormat(locale, {
        month: "long",
        timeZone,
        year: "numeric",
      }).format(startsAt),
      morning: period === "morning" ? [presentedSlot] : [],
      afternoon: period === "afternoon" ? [presentedSlot] : [],
      evening: period === "evening" ? [presentedSlot] : [],
    });
  }

  return [...days.values()].map(({ morning, afternoon, evening, ...day }) => ({
    ...day,
    periods: [
      { period: "morning" as const, slots: morning },
      { period: "afternoon" as const, slots: afternoon },
      { period: "evening" as const, slots: evening },
    ].filter(({ slots: periodSlots }) => periodSlots.length > 0),
  }));
}

function PeriodIcon({ period }: { period: TimePeriod }) {
  if (period === "morning") return <Sunrise aria-hidden="true" size={15} />;
  if (period === "afternoon") {
    return <SunMedium aria-hidden="true" size={15} />;
  }
  return <MoonStar aria-hidden="true" size={15} />;
}
