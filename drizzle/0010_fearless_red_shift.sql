DROP INDEX "teacher_slot_start_unique";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "recurrence" "availability_recurrence" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "exception_for_appointment_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "exception_original_starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "color" text DEFAULT '#f0d7ff' NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_students" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_exception_series_fk" FOREIGN KEY ("exception_for_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_exception_series_idx" ON "appointments" USING btree ("exception_for_appointment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_series_occurrence_unique" ON "appointments" USING btree ("exception_for_appointment_id","exception_original_starts_at");--> statement-breakpoint
CREATE INDEX "availability_slots_teacher_start_idx" ON "availability_slots" USING btree ("teacher_id","starts_at");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointment_exception_fields_paired" CHECK (("appointments"."exception_for_appointment_id" is null) = ("appointments"."exception_original_starts_at" is null));--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointment_exception_not_recurring" CHECK ("appointments"."exception_for_appointment_id" is null or "appointments"."recurrence" = 'none');--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointment_color_hex" CHECK ("appointments"."color" ~ '^#[0-9A-Fa-f]{6}$');