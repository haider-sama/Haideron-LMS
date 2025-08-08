CREATE TYPE "public"."audience_enum" AS ENUM('User', 'Student', 'DepartmentTeacher', 'DepartmentHead', 'Admin', 'ForumModerator', 'ForumCurator', 'CommunityAdmin');--> statement-breakpoint
CREATE TYPE "public"."degree_enum" AS ENUM('BS', 'MS', 'MPhil', 'PhD');--> statement-breakpoint
CREATE TYPE "public"."department_enum" AS ENUM('N/A', 'Computer Science and Engineering', 'Software Engineering', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Electrical and Electronic Engineering', 'Chemical Engineering', 'Petroleum Engineering', 'Automotive Engineering', 'Aerospace Engineering', 'Industrial Engineering', 'Metallurgical and Materials Engineering', 'Biomedical Engineering', 'Environmental Engineering', 'Mechatronics Engineering', 'Mining and Civil Engineering', 'Telecommunication Engineering', 'Geological Engineering', 'Textile Engineering', 'Architecture', 'City and Regional Planning', 'Industrial Design', 'Urban Design', 'Physics', 'Mathematics', 'Chemistry', 'Applied Sciences', 'Natural Sciences', 'Statistics', 'Data Science', 'Information Technology', 'Artificial Intelligence', 'Cybersecurity', 'Humanities and Social Sciences', 'Management Sciences', 'Engineering Management', 'Economics', 'Accounting and Finance', 'Business Administration', 'Psychology', 'Law', 'Bioinformatics', 'Nanotechnology', 'Energy Systems Engineering', 'Renewable Energy Engineering', 'Robotics Engineering', 'Transport Engineering and Management', 'Polymer and Process Engineering', 'Geomatics Engineering');--> statement-breakpoint
CREATE TYPE "public"."faculty_type_enum" AS ENUM('Permanent', 'Contractual');--> statement-breakpoint
CREATE TYPE "public"."forum_badge_enum" AS ENUM('pro-poster', 'comment-master', 'beloved', 'forum-leader', 'rising-star', 'active-contributor', 'debater', 'critic', 'popular-poster', 'veteran');--> statement-breakpoint
CREATE TYPE "public"."teacher_designation_enum" AS ENUM('Professor', 'Assistant Professor', 'Associate Professor', 'Lecturer');--> statement-breakpoint
CREATE TYPE "public"."visibility_enum" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "forum_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
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
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"designation" "teacher_designation_enum" NOT NULL,
	"joining_date" date,
	"faculty_type" "faculty_type_enum" NOT NULL,
	"subject_owner" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_qualifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_info_id" integer NOT NULL,
	"degree" "degree_enum" NOT NULL,
	"passing_year" integer NOT NULL,
	"institution_name" text NOT NULL,
	"major_subjects" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
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
	"role" "audience_enum" DEFAULT 'User' NOT NULL,
	"department" "department_enum",
	"reset_password_token" text,
	"reset_password_expires_at" timestamp,
	"token_version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "forum_profiles" ADD CONSTRAINT "forum_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_info" ADD CONSTRAINT "teacher_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_qualifications" ADD CONSTRAINT "teacher_qualifications_teacher_info_id_teacher_info_id_fk" FOREIGN KEY ("teacher_info_id") REFERENCES "public"."teacher_info"("id") ON DELETE cascade ON UPDATE no action;