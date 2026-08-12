ALTER TABLE "appointments" DROP CONSTRAINT "appointments_provider_student_id_provider_students_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_student_id_provider_students_id_fk" FOREIGN KEY ("provider_student_id") REFERENCES "public"."provider_students"("id") ON DELETE cascade ON UPDATE no action;