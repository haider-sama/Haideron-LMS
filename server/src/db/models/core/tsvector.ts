import { customType } from "drizzle-orm/pg-core";
import { sql, type SQL } from "drizzle-orm";

export const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});