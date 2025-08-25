import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import * as schema from "./schema";
import { DATABASE_URL } from "../constants/env";

dotenv.config();

const retryDelay = 5000;

const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,                  // maximum concurrent connections
    idleTimeoutMillis: 30000, // close idle clients after 30s
    connectionTimeoutMillis: 5000, // fail if can't connect in 5s
});

export const db = drizzle(pool, { schema });

export async function connectToDatabase() {
    while (true) {
        try {
            console.time("Drizzle Connect Time");

            // Test connection with a simple query
            await pool.query("SELECT 1");

            console.timeEnd("Drizzle Connect Time");
            console.log("Connected to PostgreSQL Database");
            break;
        } catch (error: any) {
            console.error("Couldn't connect to PostgreSQL:", error.message);
            console.log(`Retrying in ${retryDelay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }
}

// Optional: close connection
export async function closeDb() {
    await pool.end();
}
