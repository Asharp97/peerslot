CREATE TABLE "provider_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "provider_profiles" ("user_id", "created_at")
SELECT "user_id", "created_at"
FROM "profiles"
WHERE "role" = 'teacher'
ON CONFLICT ("user_id") DO NOTHING;--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."user_role";
