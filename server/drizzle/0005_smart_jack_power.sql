ALTER TABLE "users" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce("users"."first_name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("users"."last_name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("users"."email", '')), 'B') ||
          setweight(to_tsvector('english', coalesce("users"."city", '')), 'C') ||
          setweight(to_tsvector('english', coalesce("users"."country", '')), 'C')
        ) STORED;--> statement-breakpoint
CREATE INDEX "users_search_idx" ON "users" USING gin ("search_vector");