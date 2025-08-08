import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

const retryDelay = 5000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
