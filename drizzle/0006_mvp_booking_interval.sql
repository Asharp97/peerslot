UPDATE "booking_pages"
SET "booking_interval_minutes" = "appointment_duration_minutes"
WHERE "booking_interval_minutes" <> "appointment_duration_minutes";--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_duration_matches_interval" CHECK ("booking_pages"."appointment_duration_minutes" = "booking_pages"."booking_interval_minutes");
