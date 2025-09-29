DROP TABLE "forum_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "comment_likes" CASCADE;--> statement-breakpoint
DROP TABLE "comments" CASCADE;--> statement-breakpoint
DROP TABLE "forum_members" CASCADE;--> statement-breakpoint
DROP TABLE "forum_moderators" CASCADE;--> statement-breakpoint
DROP TABLE "forums" CASCADE;--> statement-breakpoint
DROP TABLE "post_likes" CASCADE;--> statement-breakpoint
DROP TABLE "post_votes" CASCADE;--> statement-breakpoint
DROP TABLE "posts" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_fa_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_two_fa_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DROP TYPE "public"."forum_badge_enum";--> statement-breakpoint
DROP TYPE "public"."visibility_enum";--> statement-breakpoint
DROP TYPE "public"."forum_status_enum";--> statement-breakpoint
DROP TYPE "public"."forum_type_enum";--> statement-breakpoint
DROP TYPE "public"."post_type_enum";--> statement-breakpoint
DROP TYPE "public"."vote_type_enum";