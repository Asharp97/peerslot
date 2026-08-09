ALTER TABLE "booking_pages" RENAME COLUMN "provider_user_id" TO "provider_id";--> statement-breakpoint
ALTER TABLE "booking_pages" DROP CONSTRAINT "booking_pages_provider_user_id_unique";--> statement-breakpoint
ALTER TABLE "booking_pages" DROP CONSTRAINT "booking_pages_provider_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "booking_pages" ADD COLUMN "title" text DEFAULT 'Book a meeting' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD COLUMN "time_zone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD COLUMN "appointment_duration_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD COLUMN "booking_interval_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD COLUMN "minimum_notice_hours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD COLUMN "is_published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "booking_pages" AS "booking_page"
SET
	"title" = 'Book with ' || "provider"."display_name",
	"time_zone" = "provider"."time_zone",
	"appointment_duration_minutes" = "provider"."default_appointment_duration_minutes",
	"booking_interval_minutes" = "provider"."default_appointment_duration_minutes",
	"minimum_notice_hours" = ceil("provider"."minimum_booking_notice_minutes" / 60.0)::integer
FROM "provider_profiles" AS "provider"
WHERE "booking_page"."provider_id" = "provider"."user_id";--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_pages_provider_id_provider_profiles_user_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_pages_provider_id_unique" UNIQUE("provider_id");--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_duration_valid" CHECK ("booking_pages"."appointment_duration_minutes" between 15 and 180);--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_interval_valid" CHECK ("booking_pages"."booking_interval_minutes" between 5 and 180);--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_notice_valid" CHECK ("booking_pages"."minimum_notice_hours" between 0 and 720);
