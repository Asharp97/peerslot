"use client";

import {
  CalendarPlus,
  Check,
  ChevronRight,
  Clock3,
  EyeOff,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getProviderWindowStatus,
  previewAvailabilityWindow,
  type ProviderWindowStatus,
} from "@/lib/provider-availability";

import { useProviderWorkspace } from "./provider-shell";

type AvailabilityWindow = {
  id: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  localStartsAt: string;
  localEndsAt: string;
  timeZone: string;
};

export type ProviderAvailabilityCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  addWindow: string;
  date: string;
  startsAt: string;
  endsAt: string;
  preview: string;
  previewEmpty: string;
  save: string;
  saveChanges: string;
  cancelEdit: string;
  existing: string;
  noWindows: string;
  edit: string;
  remove: string;
  disable: string;
  enable: string;
  slots: string;
  timezoneNote: string;
  invalidWindow: string;
  saveError: string;
  status: Record<ProviderWindowStatus, string>;
};

export function ProviderAvailabilityEditor({
  copy,
}: {
  copy: ProviderAvailabilityCopy;
}) {
  const locale = useLocale() as "en" | "tr";
  const { accessToken, data, refresh } = useProviderWorkspace();
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(() =>
    providerLocalDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
      data.bookingPage.timeZone,
    ),
  );
  const [startsAt, setStartsAt] = useState("09:00");
  const [endsAt, setEndsAt] = useState("12:00");

  const loadWindows = useCallback(async () => {
    const response = await fetch("/api/availability-windows", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to load availability");
    const body = (await response.json()) as { windows: AvailabilityWindow[] };
    setWindows(body.windows);
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    async function initialize() {
      try {
        await loadWindows();
      } catch {
        setError(copy.saveError);
        setLoading(false);
      }
    }

    void initialize();
  }, [copy.saveError, loadWindows]);

  const preview = useMemo(() => {
    try {
      return previewAvailabilityWindow({
        date,
        startsAt,
        endsAt,
        timeZone: data.bookingPage.timeZone,
        durationMinutes: data.bookingPage.appointmentDurationMinutes,
        intervalMinutes: data.bookingPage.bookingIntervalMinutes,
      });
    } catch {
      return null;
    }
  }, [data.bookingPage, date, endsAt, startsAt]);

  const bookedWindowIds = useMemo(
    () =>
      new Set(
        data.upcomingAppointments.flatMap(({ windowId }) =>
          windowId ? [windowId] : [],
        ),
      ),
    [data.upcomingAppointments],
  );

  async function saveWindow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview || preview.slots.length === 0) {
      setError(copy.invalidWindow);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingId
          ? `/api/availability-windows/${editingId}`
          : "/api/availability-windows",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startsAt: preview.startsAt.toISOString(),
            endsAt: preview.endsAt.toISOString(),
          }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || copy.saveError);

      resetForm();
      await Promise.all([loadWindows(), refresh()]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  }

  function editWindow(window: AvailabilityWindow) {
    const [localDate, localStart] = window.localStartsAt.split("T");
    const [, localEnd] = window.localEndsAt.split("T");
    setEditingId(window.id);
    setDate(localDate);
    setStartsAt(localStart.slice(0, 5));
    setEndsAt(localEnd.slice(0, 5));
    setError("");
    windowScrollToEditor();
  }

  async function updateActivity(window: AvailabilityWindow) {
    await mutateWindow(window.id, "PATCH", { isActive: !window.isActive });
  }

  async function removeWindow(windowId: string) {
    await mutateWindow(windowId, "DELETE");
  }

  async function mutateWindow(
    windowId: string,
    method: "PATCH" | "DELETE",
    body?: object,
  ) {
    setError("");
    const response = await fetch(`/api/availability-windows/${windowId}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || copy.saveError);
      return;
    }
    if (editingId === windowId) resetForm();
    await Promise.all([loadWindows(), refresh()]);
  }

  function resetForm() {
    setEditingId(null);
    setDate(
      providerLocalDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        data.bookingPage.timeZone,
      ),
    );
    setStartsAt("09:00");
    setEndsAt("12:00");
  }

  return (
    <div>
      <section>
        <p className="text-[11px] font-bold tracking-[0.16em] text-black/45 uppercase">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55 sm:text-base">
          {copy.intro}
        </p>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <form
          className="h-fit rounded-[28px] bg-vast-ink p-6 text-white sm:p-7"
          id="availability-editor"
          onSubmit={saveWindow}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-flow-lime text-vast-ink">
                {editingId ? <Pencil size={18} /> : <Plus size={19} />}
              </span>
              <h2 className="font-bold">
                {editingId ? copy.saveChanges : copy.addWindow}
              </h2>
            </div>
            {editingId ? (
              <button
                aria-label={copy.cancelEdit}
                className="grid size-9 place-items-center rounded-full bg-white/10"
                onClick={resetForm}
                type="button"
              >
                <X size={17} />
              </button>
            ) : null}
          </div>

          <label className="mt-7 block text-xs font-bold text-white/60">
            {copy.date}
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-white/8 px-4 text-sm text-white scheme-dark"
              min={providerLocalDate(new Date(), data.bookingPage.timeZone)}
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <TimeInput
              label={copy.startsAt}
              onChange={setStartsAt}
              value={startsAt}
            />
            <TimeInput
              label={copy.endsAt}
              onChange={setEndsAt}
              value={endsAt}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-white/45">
            {copy.timezoneNote.replace("{timeZone}", data.bookingPage.timeZone)}
          </p>

          <div className="mt-6 rounded-2xl bg-white/8 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">{copy.preview}</p>
              {preview?.slots.length ? (
                <span className="rounded-full bg-flow-lime px-2.5 py-1 text-[10px] font-bold text-vast-ink">
                  {preview.slots.length} {copy.slots}
                </span>
              ) : null}
            </div>
            {preview?.slots.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.slots.map((slot) => (
                  <span
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs"
                    key={slot.startsAt.toISOString()}
                  >
                    {formatTime(
                      slot.startsAt,
                      locale,
                      data.bookingPage.timeZone,
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/40">{copy.previewEmpty}</p>
            )}
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-[#ffb8ad] px-4 py-3 text-xs font-semibold text-[#641c14]">
              {error}
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-flow-lime px-5 text-sm font-bold text-vast-ink disabled:opacity-50"
            disabled={saving || !preview?.slots.length}
            type="submit"
          >
            {saving ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Check size={17} />
            )}
            {editingId ? copy.saveChanges : copy.save}
          </button>
        </form>

        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold">{copy.existing}</h2>
            <StatusLegend copy={copy.status} />
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="grid min-h-48 place-items-center rounded-[24px] border border-black/10 bg-[#fbfaf4]">
                <LoaderCircle className="animate-spin" size={20} />
              </div>
            ) : windows.length ? (
              windows.map((window) => {
                const status = getProviderWindowStatus({
                  windowId: window.id,
                  startsAt: new Date(window.startsAt),
                  endsAt: new Date(window.endsAt),
                  isActive: window.isActive,
                  isPagePublished: data.bookingPage.isPublished,
                  bookedWindowIds,
                  now: new Date(),
                });
                const booked = status === "booked";
                const past = status === "past";

                return (
                  <article
                    className="rounded-[24px] border border-black/10 bg-[#fbfaf4] p-5 transition hover:border-black/20"
                    key={window.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-black/5">
                        {status === "unpublished" ? (
                          <EyeOff size={20} />
                        ) : (
                          <CalendarPlus size={20} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold">
                            {formatDay(
                              window.startsAt,
                              locale,
                              data.bookingPage.timeZone,
                            )}
                          </p>
                          <StatusPill
                            copy={copy.status[status]}
                            status={status}
                          />
                        </div>
                        <p className="mt-1 text-xs text-black/45">
                          {formatTime(
                            new Date(window.startsAt),
                            locale,
                            data.bookingPage.timeZone,
                          )}{" "}
                          —{` `}
                          {formatTime(
                            new Date(window.endsAt),
                            locale,
                            data.bookingPage.timeZone,
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <SmallAction
                          disabled={booked || past}
                          icon={<Pencil size={14} />}
                          label={copy.edit}
                          onClick={() => editWindow(window)}
                        />
                        {!past ? (
                          <SmallAction
                            icon={
                              window.isActive ? (
                                <EyeOff size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )
                            }
                            label={window.isActive ? copy.disable : copy.enable}
                            onClick={() => void updateActivity(window)}
                          />
                        ) : null}
                        {!past ? (
                          <SmallAction
                            icon={<Trash2 size={14} />}
                            label={copy.remove}
                            onClick={() => void removeWindow(window.id)}
                          />
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="grid min-h-56 place-items-center rounded-[24px] border border-dashed border-black/15 bg-[#fbfaf4] px-8 text-center">
                <div>
                  <Clock3 className="mx-auto text-black/25" size={25} />
                  <p className="mt-4 text-sm text-black/45">{copy.noWindows}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function TimeInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-xs font-bold text-white/60">
      {label}
      <input
        className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-white/8 px-4 text-sm text-white scheme-dark"
        onChange={(event) => onChange(event.target.value)}
        required
        type="time"
        value={value}
      />
    </label>
  );
}

function StatusLegend({
  copy,
}: {
  copy: Record<ProviderWindowStatus, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(copy) as ProviderWindowStatus[]).map((status) => (
        <span
          className="flex items-center gap-1.5 text-[10px] text-black/45"
          key={status}
        >
          <span className={`size-2 rounded-full ${statusDot[status]}`} />
          {copy[status]}
        </span>
      ))}
    </div>
  );
}

function StatusPill({
  copy,
  status,
}: {
  copy: string;
  status: ProviderWindowStatus;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusPill[status]}`}
    >
      {copy}
    </span>
  );
}

function SmallAction({
  disabled,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-black/10 px-3 text-[11px] font-bold hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-35"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon} {label}
    </button>
  );
}

const statusDot: Record<ProviderWindowStatus, string> = {
  available: "bg-[#56a46f]",
  booked: "bg-[#7859d6]",
  past: "bg-black/25",
  unpublished: "bg-[#e9a43b]",
};

const statusPill: Record<ProviderWindowStatus, string> = {
  available: "bg-[#dff3e4] text-[#245e37]",
  booked: "bg-[#e8e0ff] text-[#5132aa]",
  past: "bg-black/7 text-black/45",
  unpublished: "bg-[#fff0cf] text-[#7a4b00]",
};

function providerLocalDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function formatTime(date: Date, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDay(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function windowScrollToEditor() {
  window.requestAnimationFrame(() => {
    document
      .getElementById("availability-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
