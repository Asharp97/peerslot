ALTER TABLE "booking_pages" DROP CONSTRAINT "booking_page_duration_matches_interval";--> statement-breakpoint
ALTER TABLE "booking_pages" DROP CONSTRAINT "booking_page_interval_valid";--> statement-breakpoint
UPDATE "booking_pages" AS "booking_page"
SET "booking_interval_minutes" =
  "booking_page"."appointment_duration_minutes" +
  "provider_profile"."rest_between_sessions_minutes"
FROM "provider_profiles" AS "provider_profile"
WHERE "provider_profile"."user_id" = "booking_page"."provider_id";--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_interval_covers_duration" CHECK ("booking_pages"."booking_interval_minutes" >= "booking_pages"."appointment_duration_minutes");--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_interval_valid" CHECK ("booking_pages"."booking_interval_minutes" between 15 and 300);
