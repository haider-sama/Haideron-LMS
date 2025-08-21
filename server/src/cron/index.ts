import cron from "node-cron";
import { CronExpressionParser } from "cron-parser";

type ReplayMode = "sequential" | "parallel";

type CronJob = {
    name: string;
    schedule: string; // standard cron expression
    task: () => Promise<void> | void;
    enabled?: boolean; // can be toggled
    lastRun?: Date; // tracks last completed run
    replayMode?: ReplayMode; // NEW: how to replay missed runs
};

const jobs: CronJob[] = [];

/**
 * Register a cron job into the central scheduler
 */
export function registerCronJob(job: CronJob) {
    jobs.push({ ...job, enabled: job.enabled ?? true, replayMode: job.replayMode ?? "sequential" });
}

/**
 * Start all registered cron jobs
 */
export function startCronJobs() {
    for (const job of jobs) {
        if (!job.enabled) {
            console.log(`[Cron] Skipping disabled job: ${job.name}`);
            continue;
        }

        cron.schedule(job.schedule, async () => {
            console.log(`[Cron] Running job: ${job.name} at ${new Date().toISOString()}`);
            try {
                await job.task();
                job.lastRun = new Date();
                console.log(`[Cron] Finished job: ${job.name}`);
            } catch (err) {
                console.error(`[Cron] Error in job: ${job.name}`, err);
            }
        });

        console.log(`[Cron] Registered job: ${job.name} (${job.schedule})`);
    }
}

/**
 * Catch up missed jobs — replay *all* missed runs
 */
export async function catchMissedJobs() {
    for (const job of jobs) {
        if (!job.enabled) continue;

        try {
            const interval = CronExpressionParser.parse(job.schedule, { tz: "UTC" });
            const now = new Date();
            const lastRun = job.lastRun ?? new Date(0); // if never run, start from epoch

            let next = interval.next();
            const missedRuns: Date[] = [];

            // collect all missed runs until "now"
            while (next.getTime() <= now.getTime()) {
                if (next.getTime() > lastRun.getTime()) {
                    missedRuns.push(next.toDate());
                }
                next = interval.next();
            }

            if (missedRuns.length > 0) {
                console.log(`[Cron] Missed ${missedRuns.length} run(s) for: ${job.name}`);

                if (job.replayMode === "parallel") {
                    // run all missed tasks concurrently
                    await Promise.all(
                        missedRuns.map(runTime => {
                            console.log(`[Cron] Replaying (parallel) run at ${runTime.toISOString()} for: ${job.name}`);
                            return job.task();
                        })
                    );
                } else {
                    // run missed tasks sequentially (default)
                    for (const runTime of missedRuns) {
                        console.log(`[Cron] Replaying (sequential) run at ${runTime.toISOString()} for: ${job.name}`);
                        await job.task();
                    }
                }

                job.lastRun = now;
                console.log(`[Cron] Finished replaying missed runs for: ${job.name}`);
            }
        } catch (err) {
            console.error(`[Cron] Failed to check missed job: ${job.name}`, err);
        }
    }
}
