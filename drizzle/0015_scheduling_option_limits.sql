ALTER TABLE "booking_pages" DROP CONSTRAINT "booking_page_duration_valid";--> statement-breakpoint
ALTER TABLE "booking_pages" DROP CONSTRAINT "booking_page_interval_valid";--> statement-breakpoint
ALTER TABLE "provider_profiles" DROP CONSTRAINT "provider_duration_valid";--> statement-breakpoint
ALTER TABLE "provider_profiles" DROP CONSTRAINT "provider_rest_time_valid";--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_duration_valid" CHECK ("booking_pages"."appointment_duration_minutes" between 10 and 90 and mod("booking_pages"."appointment_duration_minutes", 5) = 0);--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_page_interval_valid" CHECK ("booking_pages"."booking_interval_minutes" between 10 and 150 and mod("booking_pages"."booking_interval_minutes", 5) = 0);--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_duration_valid" CHECK ("provider_profiles"."default_appointment_duration_minutes" between 10 and 90 and mod("provider_profiles"."default_appointment_duration_minutes", 5) = 0);--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_rest_time_valid" CHECK ("provider_profiles"."rest_between_sessions_minutes" between 0 and 60 and mod("provider_profiles"."rest_between_sessions_minutes", 5) = 0);