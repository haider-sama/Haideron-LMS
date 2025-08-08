import { pgTable, varchar, timestamp, pgEnum, index, uuid, jsonb } from "drizzle-orm/pg-core";
import { VerificationCodeType } from "../../../shared/enums";
import { sql } from "drizzle-orm";

export const verification_code_type_enum = pgEnum(
    "verification_code_type_enum",
    Object.values(VerificationCodeType) as [string, ...string[]]
);

export const verificationCodes = pgTable(
    "verification_codes",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id").notNull(),
        type: verification_code_type_enum("type").notNull(),
        code: varchar("code", { length: 6 }).notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        lastSentAt: timestamp("last_sent_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        meta: jsonb("meta"), // a JSONB column
    },
    (table) => [
        index("verification_codes_user_id_index").on(table.userId),
        index("verification_codes_expires_at_index").on(table.expiresAt),
         // We cannot create a TTL index like Mongo's 'expires', but you can create a DB job to delete old codes.
    ],
);