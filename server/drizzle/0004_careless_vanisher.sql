CREATE INDEX "idx_forum_profiles_user_id" ON "forum_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teacher_info_user_id" ON "teacher_info" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teacher_qualifications_teacher_info_id" ON "teacher_qualifications" USING btree ("teacher_info_id");