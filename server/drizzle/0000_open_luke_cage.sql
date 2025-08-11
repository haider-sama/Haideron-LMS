CREATE TYPE "public"."audience_enum" AS ENUM('Guest', 'Student', 'DepartmentTeacher', 'DepartmentHead', 'Admin', 'ForumModerator', 'ForumCurator', 'CommunityAdmin');--> statement-breakpoint
CREATE TYPE "public"."degree_enum" AS ENUM('BS', 'MS', 'MPhil', 'PhD');--> statement-breakpoint
CREATE TYPE "public"."department_enum" AS ENUM('N/A', 'Computer Science and Engineering', 'Software Engineering', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Electrical and Electronic Engineering', 'Chemical Engineering', 'Petroleum Engineering', 'Automotive Engineering', 'Aerospace Engineering', 'Industrial Engineering', 'Metallurgical and Materials Engineering', 'Biomedical Engineering', 'Environmental Engineering', 'Mechatronics Engineering', 'Mining and Civil Engineering', 'Telecommunication Engineering', 'Geological Engineering', 'Textile Engineering', 'Architecture', 'City and Regional Planning', 'Industrial Design', 'Urban Design', 'Physics', 'Mathematics', 'Chemistry', 'Applied Sciences', 'Natural Sciences', 'Statistics', 'Data Science', 'Information Technology', 'Artificial Intelligence', 'Cybersecurity', 'Humanities and Social Sciences', 'Management Sciences', 'Engineering Management', 'Economics', 'Accounting and Finance', 'Business Administration', 'Psychology', 'Law', 'Bioinformatics', 'Nanotechnology', 'Energy Systems Engineering', 'Renewable Energy Engineering', 'Robotics Engineering', 'Transport Engineering and Management', 'Polymer and Process Engineering', 'Geomatics Engineering');--> statement-breakpoint
CREATE TYPE "public"."faculty_type_enum" AS ENUM('Permanent', 'Contractual');--> statement-breakpoint
CREATE TYPE "public"."forum_badge_enum" AS ENUM('pro-poster', 'comment-master', 'beloved', 'forum-leader', 'rising-star', 'active-contributor', 'debater', 'critic', 'popular-poster', 'veteran');--> statement-breakpoint
CREATE TYPE "public"."teacher_designation_enum" AS ENUM('Professor', 'Assistant Professor', 'Associate Professor', 'Lecturer');--> statement-breakpoint
CREATE TYPE "public"."visibility_enum" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."verification_code_type_enum" AS ENUM('email_verification', 'reset_password', 'email_change');--> statement-breakpoint
CREATE TYPE "public"."assessment_type_enum" AS ENUM('Quiz', 'Assignment', 'Midterm', 'Final', 'Project');--> statement-breakpoint
CREATE TYPE "public"."finalized_result_status_enum" AS ENUM('Pending', 'Confirmed', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."class_section_enum" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');--> statement-breakpoint
CREATE TYPE "public"."domain_enum" AS ENUM('Engineering', 'Non-Engineering', 'Computing', 'Management', 'Health', 'Science', 'Humanities', 'Arts and Design', 'Legal', 'Education', 'Technical and Vocational');--> statement-breakpoint
CREATE TYPE "public"."knowledge_area_enum" AS ENUM('Technology', 'Engineering', 'Science', 'Mathematics', 'Computer Science', 'Business', 'Management', 'Economics', 'Health Sciences', 'Humanities', 'Social Sciences', 'Arts', 'Design', 'Law', 'Education', 'Environmental Studies', 'Communication', 'Agricultural Sciences', 'Architecture and Planning', 'Interdisciplinary Studies');--> statement-breakpoint
CREATE TYPE "public"."subject_level_enum" AS ENUM('1st Year', '2nd Year', '3rd Year', '4th Year', 'MS', 'MSC', 'PhD');--> statement-breakpoint
CREATE TYPE "public"."subject_type_enum" AS ENUM('Theory', 'Lab', 'Thesis');--> statement-breakpoint
CREATE TYPE "public"."batch_enrollment_status_enum" AS ENUM('Active', 'Graduated', 'Dropped');--> statement-breakpoint
CREATE TYPE "public"."strength_enum" AS ENUM('Low', 'Medium', 'High');--> statement-breakpoint
CREATE TYPE "public"."term_enum" AS ENUM('Fall', 'Spring', 'Summer');--> statement-breakpoint
CREATE TABLE "forum_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" varchar(255) NOT NULL,
	"display_name" text,
	"bio" text DEFAULT '',
	"signature" text DEFAULT '',
	"interests" jsonb,
	"badges" jsonb,
	"reputation" integer DEFAULT 0,
	"visibility" "visibility_enum" DEFAULT 'public',
	"post_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "forum_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "teacher_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"designation" "teacher_designation_enum" NOT NULL,
	"joining_date" date,
	"faculty_type" "faculty_type_enum" NOT NULL,
	"subject_owner" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_qualifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_info_id" uuid NOT NULL,
	"degree" "degree_enum" NOT NULL,
	"passing_year" integer NOT NULL,
	"institution_name" text NOT NULL,
	"major_subjects" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"father_name" text,
	"first_name" text,
	"last_name" text,
	"city" text,
	"country" text,
	"avatar_url" text,
	"last_online" timestamp NOT NULL,
	"address" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"pending_email" text,
	"email_change_token" text,
	"email_change_expires_at" timestamp,
	"role" "audience_enum" DEFAULT 'Guest' NOT NULL,
	"department" "department_enum",
	"reset_password_token" text,
	"reset_password_expires_at" timestamp,
	"token_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ip" text,
	"user_agent" jsonb,
	"last_used" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "verification_code_type_enum" NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "assessment_clos" (
	"assessment_id" uuid NOT NULL,
	"clo_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"marks_obtained" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"type" "assessment_type_enum" NOT NULL,
	"title" varchar(100) NOT NULL,
	"weightage" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_grading_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"section" varchar(1) NOT NULL,
	"created_by" uuid NOT NULL,
	"rules" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finalized_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"section" varchar(1) NOT NULL,
	"submitted_by" uuid NOT NULL,
	"results" jsonb NOT NULL,
	"status" "finalized_result_status_enum" DEFAULT 'Pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"present" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clo_plo_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clo_id" uuid NOT NULL,
	"plo_id" uuid NOT NULL,
	"strength" "strength_enum" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"course_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_co_requisites" (
	"course_id" uuid NOT NULL,
	"co_req_course_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_pre_requisites" (
	"course_id" uuid NOT NULL,
	"pre_req_course_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_section_teachers" (
	"course_id" uuid NOT NULL,
	"section" "class_section_enum" NOT NULL,
	"teacher_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_sections" (
	"course_id" uuid NOT NULL,
	"section" "class_section_enum" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"program_catalogue_id" uuid NOT NULL,
	"title" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"code_prefix" varchar(10) NOT NULL,
	"description" text NOT NULL,
	"subject_level" "subject_level_enum" NOT NULL,
	"subject_type" "subject_type_enum" NOT NULL,
	"contact_hours" integer NOT NULL,
	"credit_hours" integer NOT NULL,
	"knowledge_area" "knowledge_area_enum" NOT NULL,
	"domain" "domain_enum" NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"program_batch_id" uuid NOT NULL,
	"activated_semester_id" uuid NOT NULL,
	"section_schedules" jsonb DEFAULT '{}' NOT NULL,
	"capacity_per_section" jsonb DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"section" varchar(1) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_batch_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"program_batch_id" uuid NOT NULL,
	"status" "batch_enrollment_status_enum" DEFAULT 'Active' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"program_catalogue_id" uuid NOT NULL,
	"session_year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_catalogues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"catalogue_year" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peo_plo_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peo_id" uuid NOT NULL,
	"plo_id" uuid NOT NULL,
	"strength" "strength_enum" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"program_id" uuid NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"program_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"program_level" "degree_enum" NOT NULL,
	"department_title" "department_enum" NOT NULL,
	"max_duration_years" integer NOT NULL,
	"min_credit_hours" integer DEFAULT 0 NOT NULL,
	"max_credit_hours" integer DEFAULT 0 NOT NULL,
	"requirements" text,
	"vision" text,
	"mission" text,
	"created_by" uuid NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activated_semesters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_batch_id" uuid NOT NULL,
	"semester_no" integer NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"term" "term_enum" NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"enrollment_deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semester_courses" (
	"semester_id" uuid NOT NULL,
	"course_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semesters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_catalogue_id" uuid NOT NULL,
	"semester_no" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_profiles" ADD CONSTRAINT "forum_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_info" ADD CONSTRAINT "teacher_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_qualifications" ADD CONSTRAINT "teacher_qualifications_teacher_info_id_teacher_info_id_fk" FOREIGN KEY ("teacher_info_id") REFERENCES "public"."teacher_info"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_clos" ADD CONSTRAINT "assessment_clos_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_clos" ADD CONSTRAINT "assessment_clos_clo_id_clos_id_fk" FOREIGN KEY ("clo_id") REFERENCES "public"."clos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_grading_schemes" ADD CONSTRAINT "custom_grading_schemes_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_grading_schemes" ADD CONSTRAINT "custom_grading_schemes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finalized_results" ADD CONSTRAINT "finalized_results_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finalized_results" ADD CONSTRAINT "finalized_results_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finalized_results" ADD CONSTRAINT "finalized_results_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_attendance_session_id_attendance_sessions_id_fk" FOREIGN KEY ("attendance_session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_clo_id_clos_id_fk" FOREIGN KEY ("clo_id") REFERENCES "public"."clos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clo_plo_mappings" ADD CONSTRAINT "clo_plo_mappings_plo_id_plos_id_fk" FOREIGN KEY ("plo_id") REFERENCES "public"."plos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clos" ADD CONSTRAINT "clos_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_co_requisites" ADD CONSTRAINT "course_co_requisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_co_requisites" ADD CONSTRAINT "course_co_requisites_co_req_course_id_courses_id_fk" FOREIGN KEY ("co_req_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_pre_requisites" ADD CONSTRAINT "course_pre_requisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_pre_requisites" ADD CONSTRAINT "course_pre_requisites_pre_req_course_id_courses_id_fk" FOREIGN KEY ("pre_req_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_teachers" ADD CONSTRAINT "course_section_teachers_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_section_teachers" ADD CONSTRAINT "course_section_teachers_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_catalogue_id_program_catalogues_id_fk" FOREIGN KEY ("program_catalogue_id") REFERENCES "public"."program_catalogues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_program_batch_id_program_batches_id_fk" FOREIGN KEY ("program_batch_id") REFERENCES "public"."program_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_activated_semester_id_activated_semesters_id_fk" FOREIGN KEY ("activated_semester_id") REFERENCES "public"."activated_semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_batch_enrollments" ADD CONSTRAINT "student_batch_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_batch_enrollments" ADD CONSTRAINT "student_batch_enrollments_program_batch_id_program_batches_id_fk" FOREIGN KEY ("program_batch_id") REFERENCES "public"."program_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_batches" ADD CONSTRAINT "program_batches_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_batches" ADD CONSTRAINT "program_batches_program_catalogue_id_program_catalogues_id_fk" FOREIGN KEY ("program_catalogue_id") REFERENCES "public"."program_catalogues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_batches" ADD CONSTRAINT "program_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_catalogues" ADD CONSTRAINT "program_catalogues_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_catalogues" ADD CONSTRAINT "program_catalogues_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_plo_mappings" ADD CONSTRAINT "peo_plo_mappings_peo_id_peos_id_fk" FOREIGN KEY ("peo_id") REFERENCES "public"."peos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peo_plo_mappings" ADD CONSTRAINT "peo_plo_mappings_plo_id_plos_id_fk" FOREIGN KEY ("plo_id") REFERENCES "public"."plos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peos" ADD CONSTRAINT "peos_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plos" ADD CONSTRAINT "plos_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activated_semesters" ADD CONSTRAINT "activated_semesters_program_batch_id_program_batches_id_fk" FOREIGN KEY ("program_batch_id") REFERENCES "public"."program_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_courses" ADD CONSTRAINT "semester_courses_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_courses" ADD CONSTRAINT "semester_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_program_catalogue_id_program_catalogues_id_fk" FOREIGN KEY ("program_catalogue_id") REFERENCES "public"."program_catalogues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_forum_profiles_user_id" ON "forum_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teacher_info_user_id" ON "teacher_info" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teacher_qualifications_teacher_info_id" ON "teacher_qualifications" USING btree ("teacher_info_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_index" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_codes_user_id_index" ON "verification_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_codes_expires_at_index" ON "verification_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_clos_unique" ON "assessment_clos" USING btree ("assessment_id","clo_id");--> statement-breakpoint
CREATE INDEX "assessment_clos_assessment_idx" ON "assessment_clos" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_clos_clo_idx" ON "assessment_clos" USING btree ("clo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_results_unique_assessment_student" ON "assessment_results" USING btree ("assessment_id","student_id");--> statement-breakpoint
CREATE INDEX "assessment_results_assessment_idx" ON "assessment_results" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_results_student_idx" ON "assessment_results" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assessments_unique_course_title" ON "assessments" USING btree ("course_offering_id","title");--> statement-breakpoint
CREATE INDEX "assessments_course_offering_idx" ON "assessments" USING btree ("course_offering_id");--> statement-breakpoint
CREATE INDEX "assessments_due_date_idx" ON "assessments" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_grading_schemes_course_section_unique" ON "custom_grading_schemes" USING btree ("course_offering_id","section");--> statement-breakpoint
CREATE INDEX "custom_grading_schemes_created_by_idx" ON "custom_grading_schemes" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "finalized_results_course_section_unique" ON "finalized_results" USING btree ("course_offering_id","section");--> statement-breakpoint
CREATE INDEX "finalized_results_submitted_by_idx" ON "finalized_results" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "finalized_results_reviewed_by_idx" ON "finalized_results" USING btree ("reviewed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_records_unique_session_student" ON "attendance_records" USING btree ("attendance_session_id","student_id");--> statement-breakpoint
CREATE INDEX "attendance_records_session_idx" ON "attendance_records" USING btree ("attendance_session_id");--> statement-breakpoint
CREATE INDEX "attendance_records_student_idx" ON "attendance_records" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_sessions_unique_course_date" ON "attendance_sessions" USING btree ("course_offering_id","date");--> statement-breakpoint
CREATE INDEX "attendance_sessions_course_offering_idx" ON "attendance_sessions" USING btree ("course_offering_id");--> statement-breakpoint
CREATE INDEX "attendance_sessions_date_idx" ON "attendance_sessions" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "clo_plo_unique" ON "clo_plo_mappings" USING btree ("clo_id","plo_id");--> statement-breakpoint
CREATE INDEX "clo_plo_plo_id_idx" ON "clo_plo_mappings" USING btree ("plo_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clos_course_code_unique" ON "clos" USING btree ("course_id","code");--> statement-breakpoint
CREATE INDEX "clos_course_id_idx" ON "clos" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_co_req_unique" ON "course_co_requisites" USING btree ("course_id","co_req_course_id");--> statement-breakpoint
CREATE INDEX "course_co_req_course_idx" ON "course_co_requisites" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_pre_req_unique" ON "course_pre_requisites" USING btree ("course_id","pre_req_course_id");--> statement-breakpoint
CREATE INDEX "course_pre_req_course_idx" ON "course_pre_requisites" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_section_teacher_unique" ON "course_section_teachers" USING btree ("course_id","section");--> statement-breakpoint
CREATE INDEX "course_section_teacher_course_idx" ON "course_section_teachers" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_section_unique" ON "course_sections" USING btree ("course_id","section");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_code_unique" ON "courses" USING btree ("code");--> statement-breakpoint
CREATE INDEX "courses_program_id_idx" ON "courses" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "courses_program_catalogue_id_idx" ON "courses" USING btree ("program_catalogue_id");--> statement-breakpoint
CREATE INDEX "courses_created_by_idx" ON "courses" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "course_offerings_course_idx" ON "course_offerings" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_offerings_program_batch_idx" ON "course_offerings" USING btree ("program_batch_id");--> statement-breakpoint
CREATE INDEX "course_offerings_activated_semester_idx" ON "course_offerings" USING btree ("activated_semester_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_offerings_unique" ON "course_offerings" USING btree ("course_id","program_batch_id","activated_semester_id");--> statement-breakpoint
CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrollments_course_offering_idx" ON "enrollments" USING btree ("course_offering_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_student_course_section_unique" ON "enrollments" USING btree ("student_id","course_offering_id","section");--> statement-breakpoint
CREATE INDEX "enrollments_student_active_idx" ON "enrollments" USING btree ("student_id","is_active");--> statement-breakpoint
CREATE INDEX "enrollments_course_offering_active_idx" ON "enrollments" USING btree ("course_offering_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "student_batch_enrollments_unique" ON "student_batch_enrollments" USING btree ("student_id","program_batch_id");--> statement-breakpoint
CREATE INDEX "student_batch_enrollments_student_idx" ON "student_batch_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_batch_enrollments_program_batch_idx" ON "student_batch_enrollments" USING btree ("program_batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "program_batches_program_session_unique" ON "program_batches" USING btree ("program_id","session_year");--> statement-breakpoint
CREATE INDEX "program_batches_program_id_idx" ON "program_batches" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_batches_program_catalogue_id_idx" ON "program_batches" USING btree ("program_catalogue_id");--> statement-breakpoint
CREATE INDEX "program_batches_created_by_idx" ON "program_batches" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "program_catalogues_program_year_unique" ON "program_catalogues" USING btree ("program_id","catalogue_year");--> statement-breakpoint
CREATE INDEX "program_catalogues_program_id_idx" ON "program_catalogues" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_catalogues_created_by_idx" ON "program_catalogues" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "peo_plo_unique" ON "peo_plo_mappings" USING btree ("peo_id","plo_id");--> statement-breakpoint
CREATE INDEX "peo_plo_plo_id_idx" ON "peo_plo_mappings" USING btree ("plo_id");--> statement-breakpoint
CREATE INDEX "peos_program_id_idx" ON "peos" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plos_program_code_unique" ON "plos" USING btree ("program_id","code");--> statement-breakpoint
CREATE INDEX "plos_program_id_idx" ON "plos" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_title_unique" ON "programs" USING btree ("title");--> statement-breakpoint
CREATE INDEX "programs_created_by_idx" ON "programs" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "activated_semesters_batch_semester_unique" ON "activated_semesters" USING btree ("program_batch_id","semester_no");--> statement-breakpoint
CREATE INDEX "activated_semesters_program_batch_id_idx" ON "activated_semesters" USING btree ("program_batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "semester_courses_semester_course_unique" ON "semester_courses" USING btree ("semester_id","course_id");--> statement-breakpoint
CREATE INDEX "semester_courses_semester_id_idx" ON "semester_courses" USING btree ("semester_id");--> statement-breakpoint
CREATE INDEX "semester_courses_course_id_idx" ON "semester_courses" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "semesters_program_catalogue_semester_no_unique" ON "semesters" USING btree ("program_catalogue_id","semester_no");--> statement-breakpoint
CREATE INDEX "semesters_program_catalogue_id_idx" ON "semesters" USING btree ("program_catalogue_id");