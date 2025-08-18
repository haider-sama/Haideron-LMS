CREATE TABLE "finalized_result_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finalized_result_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"grade" varchar(2) NOT NULL,
	"grade_point" numeric(3, 2) NOT NULL,
	"weighted_percentage" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "search_vector" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "finalized_result_entries" ADD CONSTRAINT "finalized_result_entries_finalized_result_id_finalized_results_id_fk" FOREIGN KEY ("finalized_result_id") REFERENCES "public"."finalized_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finalized_result_entries" ADD CONSTRAINT "finalized_result_entries_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;