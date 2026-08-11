"use client";

import type {
  EventClickArg,
  EventContentArg,
  EventInput,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import trLocale from "@fullcalendar/core/locales/tr";
import interactionPlugin, {
  type DateClickArg,
} from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarPlus, LoaderCircle, RotateCcw, UserPlus } from "lucide-react";
import { useLocale } from "next-intl";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatInTimeZone } from "@/lib/availability-window";
import { zonedLocalDateTimeToUtc } from "@/lib/provider-availability";

import { useProviderWorkspace } from "./provider-shell";

type ProviderStudent = {
  id: string;
  displayName: string;
  email: string | null;
};

type CalendarAppointment = {
  id: string;
  providerStudentId: string | null;
  studentName: string;
  studentEmail: string | null;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "cancelled";
  comment: string | null;
  examName: string | null;
  schoolYear: string | null;
  createdByProvider: boolean;
  rescheduleCount: number;
};

type SessionDraft = {
  appointmentId: string | null;
  studentId: string;
  studentName: string;
  newStudentName: string;
  newStudentEmail: string;
  date: string;
  startsAt: string;
  endsAt: string;
  contextType: "examName" | "schoolYear";
  contextValue: string;
  comment: string;
  status: "scheduled" | "cancelled";
};

export type ProviderAppointmentsCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  addSession: string;
  editSession: string;
  addSessionDescription: string;
  editSessionDescription: string;
  student: string;
  existingStudent: string;
  newStudent: string;
  studentName: string;
  studentEmail: string;
  date: string;
  startsAt: string;
  endsAt: string;
  sessionContext: string;
  examName: string;
  schoolYear: string;
  contextValue: string;
  comment: string;
  commentPlaceholder: string;
  save: string;
  saving: string;
  cancelSession: string;
  restoreSession: string;
  exceptionHelp: string;
  emptyStudents: string;
  loadError: string;
  saveError: string;
};

const newStudentValue = "__new_student__";
const calendarPlugins = [timeGridPlugin, interactionPlugin];
const calendarLocales = [trLocale];
const calendarDayHeaderFormat = {
  weekday: "short" as const,
  day: "numeric" as const,
};
const calendarEventTimeFormat = {
  hour: "2-digit" as const,
  minute: "2-digit" as const,
  hour12: false,
};
const calendarHeaderToolbar = {
  left: "prev,next today",
  center: "title",
  right: "",
};

export function ProviderAppointments({
  copy,
}: {
  copy: ProviderAppointmentsCopy;
}) {
  const locale = useLocale() as "en" | "tr";
  const { accessToken, data, refresh } = useProviderWorkspace();
  const [students, setStudents] = useState<ProviderStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const timeZone = data.bookingPage.timeZone;

  const loadCalendarEvents = useCallback(
    async (fetchInfo: EventSourceFuncArg): Promise<EventInput[]> => {
      setLoading(true);
      try {
        const startsAt = new Date(fetchInfo.start.getTime() - 86_400_000);
        const endsAt = new Date(fetchInfo.end.getTime() + 86_400_000);
        const response = await fetch(
          `/api/provider/appointments?startsAt=${encodeURIComponent(startsAt.toISOString())}&endsAt=${encodeURIComponent(endsAt.toISOString())}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          },
        );

        if (!response.ok) throw new Error(copy.loadError);
        const body = (await response.json()) as {
          appointments: CalendarAppointment[];
        };

        setError("");
        return body.appointments.map((appointment) =>
          appointmentToCalendarEvent(appointment, timeZone),
        );
      } catch {
        setError(copy.loadError);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [accessToken, copy.loadError, timeZone],
  );

  useEffect(() => {
    async function loadStudents() {
      const response = await fetch("/api/provider/students", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const body = (await response.json()) as { students: ProviderStudent[] };
      setStudents(body.students);
    }

    void loadStudents();
  }, [accessToken]);

  const openNewSession = useCallback(
    (date = nextRoundedHour(timeZone)) => {
      const local = localDateTime(date);
      const end = new Date(
        date.getTime() + data.bookingPage.appointmentDurationMinutes * 60_000,
      );
      const localEnd = localDateTime(end);
      setDraft({
        appointmentId: null,
        studentId: students[0]?.id ?? newStudentValue,
        studentName: "",
        newStudentName: "",
        newStudentEmail: "",
        date: local.date,
        startsAt: local.time,
        endsAt: localEnd.time,
        contextType: "schoolYear",
        contextValue: "",
        comment: "",
        status: "scheduled",
      });
      setError("");
      setDialogOpen(true);
    },
    [data.bookingPage.appointmentDurationMinutes, students, timeZone],
  );

  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      if (!info.allDay) openNewSession(info.date);
    },
    [openNewSession],
  );

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const appointment = info.event.extendedProps
        .appointment as CalendarAppointment;
      const startsAt = splitProviderDateTime(appointment.startsAt, timeZone);
      const endsAt = splitProviderDateTime(appointment.endsAt, timeZone);
      setDraft({
        appointmentId: appointment.id,
        studentId: appointment.providerStudentId ?? "",
        studentName: appointment.studentName,
        newStudentName: "",
        newStudentEmail: "",
        date: startsAt.date,
        startsAt: startsAt.time,
        endsAt: endsAt.time,
        contextType: appointment.examName ? "examName" : "schoolYear",
        contextValue: appointment.examName ?? appointment.schoolYear ?? "",
        comment: appointment.comment ?? "",
        status: appointment.status,
      });
      setError("");
      setDialogOpen(true);
    },
    [timeZone],
  );

  async function saveSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError("");

    try {
      const startsAt = zonedLocalDateTimeToUtc(
        draft.date,
        draft.startsAt,
        timeZone,
      );
      const endsAt = zonedLocalDateTimeToUtc(
        draft.date,
        draft.endsAt,
        timeZone,
      );
      const context = {
        examName: draft.contextType === "examName" ? draft.contextValue : null,
        schoolYear:
          draft.contextType === "schoolYear" ? draft.contextValue : null,
      };

      if (draft.appointmentId) {
        const response = await fetch(
          `/api/provider/appointments/${draft.appointmentId}`,
          {
            method: "PATCH",
            headers: authenticatedJsonHeaders(accessToken),
            body: JSON.stringify({
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
              comment: draft.comment || null,
              ...context,
              status: draft.status,
            }),
          },
        );
        if (!response.ok) throw new Error(await responseError(response));
      } else {
        let providerStudentId = draft.studentId;
        if (providerStudentId === newStudentValue) {
          const studentResponse = await fetch("/api/provider/students", {
            method: "POST",
            headers: authenticatedJsonHeaders(accessToken),
            body: JSON.stringify({
              displayName: draft.newStudentName,
              email: draft.newStudentEmail || undefined,
            }),
          });
          if (!studentResponse.ok) {
            throw new Error(await responseError(studentResponse));
          }
          const studentBody = (await studentResponse.json()) as {
            student: ProviderStudent;
          };
          providerStudentId = studentBody.student.id;
          setStudents((current) =>
            current.some(({ id }) => id === studentBody.student.id)
              ? current
              : [...current, studentBody.student].sort((first, second) =>
                  first.displayName.localeCompare(second.displayName),
                ),
          );
        }

        const response = await fetch("/api/provider/appointments", {
          method: "POST",
          headers: authenticatedJsonHeaders(accessToken),
          body: JSON.stringify({
            providerStudentId,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            comment: draft.comment || undefined,
            examName: context.examName ?? undefined,
            schoolYear: context.schoolYear ?? undefined,
          }),
        });
        if (!response.ok) throw new Error(await responseError(response));
      }

      calendarRef.current?.getApi().refetchEvents();
      await refresh();
      setDialogOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCancellation() {
    if (!draft?.appointmentId) return;
    setDraft({
      ...draft,
      status: draft.status === "scheduled" ? "cancelled" : "scheduled",
    });
  }

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-160 flex-col lg:h-[calc(100dvh-5rem)]">
      <header className="mb-4 flex shrink-0 items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-black/45 uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-[-0.04em] sm:text-5xl">
            {copy.title}
          </h1>
        </div>
        <Button
          className="min-h-11 rounded-full bg-vast-ink px-5 font-bold text-white"
          onClick={() => openNewSession()}
        >
          <CalendarPlus size={17} /> {copy.addSession}
        </Button>
      </header>

      {error && !dialogOpen ? (
        <p className="mb-3 rounded-xl bg-ember-glow px-4 py-3 text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <section className="provider-calendar relative min-h-0 flex-1 overflow-x-auto rounded-[24px] border border-black/10 bg-[#fbfaf4] p-3 shadow-sm sm:p-4">
        {loading ? (
          <span className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full bg-lavender-whisper">
            <LoaderCircle className="animate-spin" size={16} />
          </span>
        ) : null}
        <div className="h-full min-w-190">
          <FullCalendar
            allDaySlot={false}
            dateClick={handleDateClick}
            dayHeaderFormat={calendarDayHeaderFormat}
            eventClick={handleEventClick}
            eventContent={renderSession}
            eventMinHeight={34}
            eventTimeFormat={calendarEventTimeFormat}
            events={loadCalendarEvents}
            expandRows
            firstDay={1}
            headerToolbar={calendarHeaderToolbar}
            height="100%"
            initialView="timeGridWeek"
            locale={locale}
            locales={calendarLocales}
            nowIndicator
            plugins={calendarPlugins}
            ref={calendarRef}
            scrollTime="08:00:00"
            slotDuration="00:30:00"
            slotMaxTime="22:00:00"
            slotMinTime="07:00:00"
            timeZone="local"
          />
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          {draft ? (
            <form onSubmit={saveSession}>
              <DialogHeader>
                <DialogTitle className="font-display text-3xl">
                  {draft.appointmentId ? copy.editSession : copy.addSession}
                </DialogTitle>
                <DialogDescription>
                  {draft.appointmentId
                    ? copy.editSessionDescription
                    : copy.addSessionDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {draft.appointmentId ? (
                  <Field label={copy.student}>
                    <div className="flex min-h-11 items-center rounded-xl border border-black/10 bg-black/3 px-3 text-sm font-semibold">
                      {draft.studentName}
                    </div>
                  </Field>
                ) : (
                  <Field label={copy.student}>
                    <Select
                      onValueChange={(studentId) =>
                        setDraft({ ...draft, studentId })
                      }
                      value={draft.studentId}
                    >
                      <SelectTrigger className="min-h-11 w-full rounded-xl">
                        <SelectValue placeholder={copy.emptyStudents} />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.displayName}
                          </SelectItem>
                        ))}
                        <SelectItem value={newStudentValue}>
                          {copy.newStudent}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {!draft.appointmentId && draft.studentId === newStudentValue ? (
                  <>
                    <Field label={copy.studentName}>
                      <Input
                        className="min-h-11 rounded-xl"
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            newStudentName: event.target.value,
                          })
                        }
                        required
                        value={draft.newStudentName}
                      />
                    </Field>
                    <Field label={copy.studentEmail}>
                      <Input
                        className="min-h-11 rounded-xl"
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            newStudentEmail: event.target.value,
                          })
                        }
                        type="email"
                        value={draft.newStudentEmail}
                      />
                    </Field>
                  </>
                ) : null}

                <Field label={copy.date}>
                  <Input
                    className="min-h-11 rounded-xl"
                    onChange={(event) =>
                      setDraft({ ...draft, date: event.target.value })
                    }
                    required
                    type="date"
                    value={draft.date}
                  />
                </Field>
                <Field label={copy.startsAt}>
                  <Input
                    className="min-h-11 rounded-xl"
                    onChange={(event) =>
                      setDraft({ ...draft, startsAt: event.target.value })
                    }
                    required
                    type="time"
                    value={draft.startsAt}
                  />
                </Field>
                <Field label={copy.endsAt}>
                  <Input
                    className="min-h-11 rounded-xl"
                    onChange={(event) =>
                      setDraft({ ...draft, endsAt: event.target.value })
                    }
                    required
                    type="time"
                    value={draft.endsAt}
                  />
                </Field>
                <Field label={copy.sessionContext}>
                  <Select
                    onValueChange={(contextType) =>
                      setDraft({
                        ...draft,
                        contextType: contextType as "examName" | "schoolYear",
                        contextValue: "",
                      })
                    }
                    value={draft.contextType}
                  >
                    <SelectTrigger className="min-h-11 w-full rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="examName">{copy.examName}</SelectItem>
                      <SelectItem value="schoolYear">
                        {copy.schoolYear}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={copy.contextValue}>
                  <Input
                    className="min-h-11 rounded-xl"
                    onChange={(event) =>
                      setDraft({ ...draft, contextValue: event.target.value })
                    }
                    required
                    value={draft.contextValue}
                  />
                </Field>
                <Field className="sm:col-span-2" label={copy.comment}>
                  <Textarea
                    className="min-h-24 rounded-xl"
                    onChange={(event) =>
                      setDraft({ ...draft, comment: event.target.value })
                    }
                    placeholder={copy.commentPlaceholder}
                    value={draft.comment}
                  />
                </Field>
              </div>

              {draft.appointmentId ? (
                <p className="mt-4 rounded-xl bg-lavender-whisper px-4 py-3 text-xs leading-5">
                  {copy.exceptionHelp}
                </p>
              ) : null}
              {error ? (
                <p className="mt-4 rounded-xl bg-ember-glow px-4 py-3 text-xs font-semibold">
                  {error}
                </p>
              ) : null}

              <DialogFooter className="mt-6 -mx-4 -mb-4">
                {draft.appointmentId ? (
                  <Button
                    onClick={toggleCancellation}
                    type="button"
                    variant="outline"
                  >
                    {draft.status === "scheduled" ? (
                      copy.cancelSession
                    ) : (
                      <>
                        <RotateCcw size={15} /> {copy.restoreSession}
                      </>
                    )}
                  </Button>
                ) : null}
                <Button disabled={saving} type="submit">
                  {saving ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : draft.studentId === newStudentValue ? (
                    <UserPlus size={16} />
                  ) : (
                    <CalendarPlus size={16} />
                  )}
                  {saving ? copy.saving : copy.save}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 text-xs font-bold text-black/55">{label}</Label>
      {children}
    </div>
  );
}

function renderSession(info: EventContentArg) {
  const appointment = info.event.extendedProps
    .appointment as CalendarAppointment;
  const context = appointment.examName ?? appointment.schoolYear;

  return (
    <div className="overflow-hidden px-1 py-0.5 leading-tight text-forest-ink">
      <p className="truncate text-[11px] font-bold">
        {appointment.studentName}
      </p>
      {context ? (
        <p className="truncate text-[9px] opacity-70">{context}</p>
      ) : null}
    </div>
  );
}

function appointmentToCalendarEvent(
  appointment: CalendarAppointment,
  timeZone: string,
): EventInput {
  return {
    id: appointment.id,
    title: appointment.studentName,
    start: formatInTimeZone(new Date(appointment.startsAt), timeZone),
    end: formatInTimeZone(new Date(appointment.endsAt), timeZone),
    classNames:
      appointment.status === "cancelled"
        ? ["provider-session-cancelled"]
        : ["provider-session-scheduled"],
    extendedProps: { appointment },
  };
}

function authenticatedJsonHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? "Unable to save the session";
}

function nextRoundedHour(timeZone: string) {
  const date = new Date(formatInTimeZone(new Date(), timeZone));
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

function localDateTime(date: Date) {
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function splitProviderDateTime(value: string, timeZone: string) {
  const [date, time] = formatInTimeZone(new Date(value), timeZone).split("T");
  return { date, time: time.slice(0, 5) };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
