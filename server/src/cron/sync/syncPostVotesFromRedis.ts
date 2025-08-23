import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { registerCronJob } from "..";
import { posts } from "../../db/schema";
import { redisClient } from "../../lib/redis";
import { eq } from "drizzle-orm";

// Initialize Postgres connection
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// Helper to get Redis keys for votes
const getRedisVoteKeysForCron = (postId: string) => ({
    upvoteCountKey: `post:${postId}:upvoteCount`,
    downvoteCountKey: `post:${postId}:downvoteCount`,
});

// Cron job task: sync upvotes/downvotes from Redis to Postgres
async function syncPostVotesFromRedis() {
    try {
        console.log("[PostVoteCron] Syncing post votes from Redis to Postgres...");

        // Scan all posts by upvote set keys
        for await (const rawKey of redisClient.scanIterator({ MATCH: "post:*:upvotes", COUNT: 1000 })) {
            const match = rawKey.toString().match(/^post:(.+):upvotes$/);
            if (!match) continue;

            const postId = match[1];
            const { upvoteCountKey, downvoteCountKey } = getRedisVoteKeysForCron(postId);

            const upvoteCount = parseInt((await redisClient.get(upvoteCountKey)) || "0");
            const downvoteCount = parseInt((await redisClient.get(downvoteCountKey)) || "0");

            // Update Postgres
            await db.update(posts)
                .set({ upvoteCount, downvoteCount })
                .where(eq(posts.id, postId));

            // Optional: clear Redis for posts older than 1 day
            const postRow = await db
                .select({ createdAt: posts.createdAt })
                .from(posts)
                .where(eq(posts.id, postId))
                .limit(1)
                .then(r => r[0]);

            if (postRow) {
                const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
                if (postRow.createdAt < oneDayAgo) {
                    await redisClient.del([
                        upvoteCountKey,
                        downvoteCountKey,
                        `post:${postId}:upvotes`,
                        `post:${postId}:downvotes`,
                    ]);
                }
            }
        }

        console.log("[PostVoteCron] Successfully synced post votes from Redis to Postgres.");
    } catch (err) {
        console.error("[PostVoteCron] Error syncing post votes:", err);
    }
}

// Register cron job: runs every 30 minutes
registerCronJob({
    name: "PostVoteSync-Cron",
    schedule: "*/30 * * * *",
    task: syncPostVotesFromRedis,
    replayMode: "parallel", // safe: posts are independent
});