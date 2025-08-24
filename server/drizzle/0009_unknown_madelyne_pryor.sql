CREATE TYPE "public"."forum_status_enum" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."forum_type_enum" AS ENUM('course', 'program', 'department', 'faculty', 'university', 'student-group', 'event', 'announcement', 'research', 'admin', 'public', 'support', 'alumni', 'general');--> statement-breakpoint
CREATE TYPE "public"."post_type_enum" AS ENUM('TEXT', 'LINK', 'MEDIA', 'QUESTION');--> statement-breakpoint
CREATE TYPE "public"."vote_type_enum" AS ENUM('UPVOTE', 'DOWNVOTE');--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"parent_id" uuid,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"children_count" integer DEFAULT 0 NOT NULL,
	"is_best" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_members" (
	"forum_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_moderators" (
	"forum_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon_url" text,
	"type" "forum_type_enum" NOT NULL,
	"status" "forum_status_enum" DEFAULT 'pending' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce("forums"."title", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("forums"."description", '')), 'B')
        ) STORED NOT NULL,
	CONSTRAINT "forums_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_votes" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_type" "vote_type_enum" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"forum_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"type" "post_type_enum" NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"link_preview" jsonb,
	"media_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"downvote_count" integer DEFAULT 0 NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"last_edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (
                  setweight(to_tsvector('english', coalesce("posts"."slug", '')), 'A') ||
                  setweight(to_tsvector('english', coalesce("posts"."content", '')), 'B') ||
                  setweight(to_tsvector('english', coalesce(("posts"."link_preview" ->> 'title'), '')), 'C') ||
                  setweight(to_tsvector('english', coalesce(("posts"."link_preview" ->> 'description'), '')), 'D')
                ) STORED NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allow_forums" boolean DEFAULT true NOT NULL,
	"allow_posts" boolean DEFAULT true NOT NULL,
	"allow_comments" boolean DEFAULT true NOT NULL,
	"allow_likes" boolean DEFAULT true NOT NULL,
	"allow_messages" boolean DEFAULT true NOT NULL,
	"allow_user_registration" boolean DEFAULT true NOT NULL,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"enable_email_notifications" boolean DEFAULT true NOT NULL,
	"enable_push_notifications" boolean DEFAULT true NOT NULL,
	"max_upload_size_mb" integer DEFAULT 10 NOT NULL,
	"max_posts_per_day" integer DEFAULT 50 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_members" ADD CONSTRAINT "forum_members_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_members" ADD CONSTRAINT "forum_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_moderators" ADD CONSTRAINT "forum_moderators_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_moderators" ADD CONSTRAINT "forum_moderators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_comment_likes_unique" ON "comment_likes" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_comment_likes_comment" ON "comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_comment_likes_user" ON "comment_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comments_post_parent_created" ON "comments" USING btree ("post_id","parent_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_comments_parent" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_comments_best" ON "comments" USING btree ("is_best");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_forum_members_unique" ON "forum_members" USING btree ("forum_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_forum_members_forum" ON "forum_members" USING btree ("forum_id");--> statement-breakpoint
CREATE INDEX "idx_forum_members_user" ON "forum_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_forum_moderators" ON "forum_moderators" USING btree ("forum_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_forums_search" ON "forums" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_post_likes_unique" ON "post_likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_post_likes_post" ON "post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_likes_user" ON "post_likes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_post_votes_unique" ON "post_votes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_post_votes_post" ON "post_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_votes_user" ON "post_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_votes_type" ON "post_votes" USING btree ("vote_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_posts_slug" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_posts_forum_created" ON "posts" USING btree ("forum_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_posts_author_created" ON "posts" USING btree ("author_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_posts_pinned" ON "posts" USING btree ("is_pinned","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_posts_archived" ON "posts" USING btree ("is_archived","archived_at");--> statement-breakpoint
CREATE INDEX "idx_posts_likecount" ON "posts" USING btree ("like_count" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_posts_upvotecount" ON "posts" USING btree ("upvote_count" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_posts_search" ON "posts" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_last_online_idx" ON "users" USING btree ("last_online");