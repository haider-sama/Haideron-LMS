import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { registerCronJob } from "..";
import { posts } from "../../db/schema";
import { redisClient } from "../../lib/redis";
import { eq } from "drizzle-orm";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Sync likes from Redis to Postgres
async function syncPostLikesFromRedis() {
    try {
        console.log("[PostLikeCron] Syncing post likes from Redis to Postgres...");

        for await (const rawKey of redisClient.scanIterator({ MATCH: "post:*:likes", COUNT: 1000 })) {
            const key = rawKey.toString();
            const match = key.match(/^post:(.+):likes$/);
            if (!match) continue;

            const postId = match[1];

            // Get current like count from Redis
            const likeCountStr = await redisClient.get(`post:${postId}:likeCount`);
            const likeCount = likeCountStr ? parseInt(likeCountStr) : 0;

            // Update Post in DB
            await db
                .update(posts)
                .set({ likeCount })
                .where(eq(posts.id, postId));

            // Optional: clear Redis for older posts (older than 1 day)
            const postRow = await db
                .select({ createdAt: posts.createdAt })
                .from(posts)
                .where(eq(posts.id, postId))
                .limit(1)
                .then(r => r[0]);

            if (postRow) {
                const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
                if (postRow.createdAt < oneDayAgo) {
                    await redisClient.del([key, `post:${postId}:likeCount`]);
                }
            }
        }

        console.log("[PostLikeCron] Successfully synced post likes from Redis to Postgres.");
    } catch (err) {
        console.error("[PostLikeCron] Error syncing post likes:", err);
    }
}

registerCronJob({
    name: "PostLikeSync-Cron",
    schedule: "*/30 * * * *", // every 30 minutes
    task: syncPostLikesFromRedis,
    replayMode: "parallel", // can be parallel since posts are independent
});