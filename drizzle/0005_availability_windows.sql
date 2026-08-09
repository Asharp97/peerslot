CREATE TABLE "availability_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_page_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_window_ends_after_start" CHECK ("availability_windows"."ends_at" > "availability_windows"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "availability_slots" ADD COLUMN "availability_window_id" uuid;--> statement-breakpoint
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_booking_page_id_booking_pages_id_fk" FOREIGN KEY ("booking_page_id") REFERENCES "public"."booking_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_windows_booking_page_idx" ON "availability_windows" USING btree ("booking_page_id");--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "btree_gist";--> statement-breakpoint
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_no_active_overlap" EXCLUDE USING gist (
	"booking_page_id" WITH =,
	tstzrange("starts_at", "ends_at", '[)') WITH &&
) WHERE ("is_active");--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_availability_window_id_availability_windows_id_fk" FOREIGN KEY ("availability_window_id") REFERENCES "public"."availability_windows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_slots_window_idx" ON "availability_slots" USING btree ("availability_window_id");
