import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "@/db/auth-schema";

export const appointmentStatus = pgEnum("appointment_status", [
  "scheduled",
  "cancelled",
]);

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull(),
});

export const providerProfiles = pgTable(
  "provider_profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").default("Provider").notNull(),
    professionalTitle: text("professional_title")
      .default("Professional")
      .notNull(),
    timeZone: text("time_zone").default("UTC").notNull(),
    defaultAppointmentDurationMinutes: integer(
      "default_appointment_duration_minutes",
    )
      .default(30)
      .notNull(),
    minimumBookingNoticeMinutes: integer("minimum_booking_notice_minutes")
      .default(24 * 60)
      .notNull(),
    restBetweenSessionsMinutes: integer("rest_between_sessions_minutes")
      .default(10)
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check(
      "provider_duration_valid",
      sql`${table.defaultAppointmentDurationMinutes} between 15 and 180`,
    ),
    check(
      "provider_booking_notice_valid",
      sql`${table.minimumBookingNoticeMinutes} between 0 and 43200`,
    ),
    check(
      "provider_rest_time_valid",
      sql`${table.restBetweenSessionsMinutes} between 0 and 120`,
    ),
  ],
);

export const bookingPages = pgTable(
  "booking_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .unique()
      .references(() => providerProfiles.userId, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    title: text("title").default("Book a meeting").notNull(),
    timeZone: text("time_zone").default("UTC").notNull(),
    appointmentDurationMinutes: integer("appointment_duration_minutes")
      .default(30)
      .notNull(),
    bookingIntervalMinutes: integer("booking_interval_minutes")
      .default(30)
      .notNull(),
    minimumNoticeHours: integer("minimum_notice_hours").default(24).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check("booking_page_slug_length", sql`char_length(${table.slug}) = 8`),
    check(
      "booking_page_duration_valid",
      sql`${table.appointmentDurationMinutes} between 15 and 180`,
    ),
    check(
      "booking_page_interval_valid",
      sql`${table.bookingIntervalMinutes} between 15 and 300`,
    ),
    check(
      "booking_page_interval_covers_duration",
      sql`${table.bookingIntervalMinutes} >= ${table.appointmentDurationMinutes}`,
    ),
    check(
      "booking_page_notice_valid",
      sql`${table.minimumNoticeHours} between 0 and 720`,
    ),
  ],
);

export const availabilityWindows = pgTable(
  "availability_windows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingPageId: uuid("booking_page_id")
      .notNull()
      .references(() => bookingPages.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("availability_windows_booking_page_idx").on(table.bookingPageId),
    check(
      "availability_window_ends_after_start",
      sql`${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    availabilityWindowId: uuid("availability_window_id").references(
      () => availabilityWindows.id,
      { onDelete: "cascade" },
    ),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("availability_slots_window_idx").on(table.availabilityWindowId),
    uniqueIndex("teacher_slot_start_unique").on(
      table.teacherId,
      table.startsAt,
    ),
    check("slot_ends_after_start", sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => availabilitySlots.id),
    rescheduleCount: integer("reschedule_count").default(0).notNull(),
    status: appointmentStatus("status").default("scheduled").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("appointment_slot_unique").on(table.slotId),
    index("appointments_student_idx").on(table.studentId),
    check(
      "reschedule_count_valid",
      sql`${table.rescheduleCount} between 0 and 1`,
    ),
  ],
);
