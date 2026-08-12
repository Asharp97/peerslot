ALTER TABLE "appointments" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TYPE "public"."appointment_status" RENAME TO "appointment_status_old";--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'scheduled', 'declined', 'cancelled');--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" TYPE "public"."appointment_status" USING "status"::text::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'scheduled';--> statement-breakpoint
DROP TYPE "public"."appointment_status_old";--> statement-breakpoint
DROP INDEX "appointment_slot_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_slot_unique" ON "appointments" USING btree ("slot_id") WHERE "appointments"."status" in ('pending', 'scheduled');
