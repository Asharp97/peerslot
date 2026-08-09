CREATE TABLE "booking_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_user_id" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_pages_provider_user_id_unique" UNIQUE("provider_user_id"),
	CONSTRAINT "booking_pages_slug_unique" UNIQUE("slug"),
	CONSTRAINT "booking_page_slug_length" CHECK (char_length("booking_pages"."slug") = 8)
);
--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "display_name" text DEFAULT 'Provider' NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "professional_title" text DEFAULT 'Professional' NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "time_zone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "default_appointment_duration_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "minimum_booking_notice_minutes" integer DEFAULT 1440 NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "rest_between_sessions_minutes" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_pages_provider_user_id_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_duration_valid" CHECK ("provider_profiles"."default_appointment_duration_minutes" between 15 and 180);--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_booking_notice_valid" CHECK ("provider_profiles"."minimum_booking_notice_minutes" between 0 and 43200);--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_rest_time_valid" CHECK ("provider_profiles"."rest_between_sessions_minutes" between 0 and 120);