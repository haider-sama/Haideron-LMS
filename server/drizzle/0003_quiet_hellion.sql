DROP INDEX "course_section_teacher_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "course_section_teacher_unique" ON "course_section_teachers" USING btree ("course_id","section","teacher_id");