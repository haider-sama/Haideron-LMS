ALTER TABLE "courses" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (
                setweight(to_tsvector('english', coalesce("courses"."title", '')), 'A') ||
                setweight(to_tsvector('english', coalesce("courses"."code", '')), 'A') ||
                setweight(to_tsvector('english', coalesce("courses"."code_prefix", '')), 'B') ||
                setweight(to_tsvector('english', coalesce("courses"."description", '')), 'C')
            ) STORED NOT NULL;--> statement-breakpoint
CREATE INDEX "courses_search_idx" ON "courses" USING gin ("search_vector");