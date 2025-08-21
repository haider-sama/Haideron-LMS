import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { dropAuditPartitionsBefore, provisionAuditPartitions } from "../utils/logs/audit-partitions";
import { registerCronJob } from "./index";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

function computeCutoff(retainMonths: number): [number, number] {
    const now = new Date();
    now.setUTCDate(1);
    now.setUTCMonth(now.getUTCMonth() - retainMonths);
    return [now.getUTCFullYear(), now.getUTCMonth() + 1];
}

async function runAuditMaintenance() {
    console.log("[AuditCron] Running partition maintenance job...");

    // 1. Ensure partitions
    for (const stmt of provisionAuditPartitions()) {
        await db.execute(stmt);
    }
    console.log("[AuditCron] Provisioned current + next partitions");

    // 2. Drop old partitions
    const [cutoffYear, cutoffMonth] = computeCutoff(24);
    for (const stmt of dropAuditPartitionsBefore(cutoffYear, cutoffMonth)) {
        await db.execute(stmt);
    }
    console.log(`[AuditCron] Dropped partitions older than ${cutoffYear}-${cutoffMonth}`);
}

// Primary job (monthly)
registerCronJob({
    name: "AuditPartitionMaintenance-Monthly",
    schedule: "0 1 1 * *", // 1st of every month at 01:00 UTC
    task: runAuditMaintenance,
    replayMode: "sequential" // safe (default)
});

// Fallback job (daily)
registerCronJob({
    name: "AuditPartitionMaintenance-DailyFallback",
    schedule: "0 2 * * *", // every day at 02:00 UTC
    task: runAuditMaintenance,
    replayMode: "parallel" // faster if tasks are independent
});
