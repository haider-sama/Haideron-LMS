CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(80) NOT NULL,
	"actor_id" uuid NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" varchar(80) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce("audit_logs"."action", '')), 'A') ||
        setweight(to_tsvector('english', coalesce("audit_logs"."entity_type", '')), 'B') ||
        setweight(to_tsvector('english', coalesce("audit_logs"."entity_id", '')), 'C') ||
        setweight(to_tsvector('english', coalesce("audit_logs"."metadata"::text, '')), 'D')
      ) STORED
);
--> statement-breakpoint
CREATE INDEX "audit_logs_entity_timeline_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_timeline_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_timeline_idx" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_metadata_gin_idx" ON "audit_logs" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "audit_logs_search_idx" ON "audit_logs" USING gin ("search_vector");