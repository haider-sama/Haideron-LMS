ALTER TABLE "courses" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "semesters" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "semesters" ADD COLUMN "archived_at" timestamp;