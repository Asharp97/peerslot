"use client";

import { CalendarCheck, CalendarX, Clock3, Mail } from "lucide-react";
import { useLocale } from "next-intl";

import type { ProviderWorkspaceAppointment } from "@/lib/provider-workspace-types";

import { useProviderWorkspace } from "./provider-shell";

export type ProviderAppointmentsCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  upcoming: string;
  recent: string;
  noUpcoming: string;
  noRecent: string;
  scheduled: string;
  cancelled: string;
  student: string;
};

export function ProviderAppointments({
  copy,
}: {
  copy: ProviderAppointmentsCopy;
}) {
  const locale = useLocale();
  const { data } = useProviderWorkspace();

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

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <AppointmentSection
          appointments={data.upcomingAppointments}
          copy={copy}
          empty={copy.noUpcoming}
          locale={locale}
          timeZone={data.bookingPage.timeZone}
          title={copy.upcoming}
        />
        <AppointmentSection
          appointments={data.recentBookings}
          compact
          copy={copy}
          empty={copy.noRecent}
          locale={locale}
          timeZone={data.bookingPage.timeZone}
          title={copy.recent}
        />
      </section>
    </div>
  );
}

function AppointmentSection({
  appointments,
  compact = false,
  copy,
  empty,
  locale,
  timeZone,
  title,
}: {
  appointments: ProviderWorkspaceAppointment[];
  compact?: boolean;
  copy: ProviderAppointmentsCopy;
  empty: string;
  locale: string;
  timeZone: string;
  title: string;
}) {
  return (
    <article className="rounded-[28px] border border-black/10 bg-[#fbfaf4] p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-flow-lime">
          {compact ? <Clock3 size={18} /> : <CalendarCheck size={18} />}
        </span>
        <h2 className="font-bold">{title}</h2>
        <span className="ml-auto rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-black/45">
          {appointments.length}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {appointments.length ? (
          appointments.map((appointment) => (
            <AppointmentRow
              appointment={appointment}
              compact={compact}
              copy={copy}
              key={appointment.id}
              locale={locale}
              timeZone={timeZone}
            />
          ))
        ) : (
          <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-black/15 px-8 text-center text-sm text-black/40">
            {empty}
          </div>
        )}
      </div>
    </article>
  );
}

function AppointmentRow({
  appointment,
  compact,
  copy,
  locale,
  timeZone,
}: {
  appointment: ProviderWorkspaceAppointment;
  compact: boolean;
  copy: ProviderAppointmentsCopy;
  locale: string;
  timeZone: string;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${appointment.status === "scheduled" ? "bg-[#e8e0ff] text-[#5132aa]" : "bg-black/5 text-black/35"}`}
        >
          {appointment.status === "scheduled" ? (
            <CalendarCheck size={17} />
          ) : (
            <CalendarX size={17} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold">
              {appointment.studentName}
            </p>
            <span
              className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${appointment.status === "scheduled" ? "bg-[#dff3e4] text-[#245e37]" : "bg-black/5 text-black/40"}`}
            >
              {appointment.status === "scheduled"
                ? copy.scheduled
                : copy.cancelled}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-black/45">
            <Mail size={12} /> {appointment.studentEmail}
          </p>
          <p className="mt-3 text-xs font-semibold">
            {new Intl.DateTimeFormat(locale, {
              timeZone,
              dateStyle: compact ? "medium" : "full",
              timeStyle: "short",
            }).formatRange(
              new Date(appointment.startsAt),
              new Date(appointment.endsAt),
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
