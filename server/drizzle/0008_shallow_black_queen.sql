ALTER TABLE "audit_logs" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (
            setweight(to_tsvector('simple', coalesce("audit_logs"."actor_id"::text, '')), 'A') ||
            setweight(to_tsvector('simple', regexp_replace(coalesce("audit_logs"."action", ''), '_', ' ', 'g')), 'A') ||
            setweight(to_tsvector('simple', regexp_replace(coalesce("audit_logs"."entity_type", ''), '_', ' ', 'g')), 'B') ||
            setweight(to_tsvector('simple', regexp_replace(coalesce("audit_logs"."entity_id", ''), '_', ' ', 'g')), 'C') ||
            setweight(to_tsvector('simple', coalesce("audit_logs"."metadata"::text, '')), 'D')
        ) STORED;