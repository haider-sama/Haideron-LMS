ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Guest'::text;--> statement-breakpoint
DROP TYPE "public"."audience_enum";--> statement-breakpoint
CREATE TYPE "public"."audience_enum" AS ENUM('Guest', 'Student', 'DepartmentTeacher', 'DepartmentHead', 'Admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Guest'::"public"."audience_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."audience_enum" USING "role"::"public"."audience_enum";