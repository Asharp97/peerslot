CREATE TABLE "provider_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "reschedule_count_valid";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "student_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "provider_student_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "exam_name" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "school_year" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "created_by_provider" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_students" ADD CONSTRAINT "provider_students_provider_id_provider_profiles_user_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_students_provider_idx" ON "provider_students" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_students_provider_email_unique" ON "provider_students" USING btree ("provider_id","email");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_student_id_provider_students_id_fk" FOREIGN KEY ("provider_student_id") REFERENCES "public"."provider_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_provider_student_idx" ON "appointments" USING btree ("provider_student_id");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointment_student_present" CHECK ("appointments"."student_id" is not null or "appointments"."provider_student_id" is not null);--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointment_context_single" CHECK (num_nonnulls("appointments"."exam_name", "appointments"."school_year") <= 1);--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "reschedule_count_valid" CHECK ("appointments"."reschedule_count" >= 0);