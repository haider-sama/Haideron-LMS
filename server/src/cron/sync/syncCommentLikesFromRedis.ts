import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { registerCronJob } from "..";
import { comments } from "../../db/schema";
import { redisClient } from "../../lib/redis";
import { eq } from "drizzle-orm";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Sync comment likes from Redis to Postgres
async function syncCommentLikesFromRedis() {
    try {
        console.log("[CommentLikeCron] Syncing comment likes from Redis to Postgres...");

        for await (const rawKey of redisClient.scanIterator({ MATCH: "comment:*:likes", COUNT: 1000 })) {
            const key = rawKey.toString();
            const match = key.match(/^comment:(.+):likes$/);
            if (!match) continue;

            const commentId = match[1];

            // Get current like count from Redis
            const likeCountStr = await redisClient.get(`comment:${commentId}:likeCount`);
            const likeCount = likeCountStr ? parseInt(likeCountStr) : 0;

            // Update comment in DB
            await db
                .update(comments)
                .set({ likeCount })
                .where(eq(comments.id, commentId));

            // Optional: clear Redis for older comments (e.g., older than 1 day)
            const commentRow = await db
                .select({ createdAt: comments.createdAt })
                .from(comments)
                .where(eq(comments.id, commentId))
                .limit(1)
                .then(r => r[0]);

            if (commentRow) {
                const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
                if (commentRow.createdAt < oneDayAgo) {
                    await redisClient.del([key, `comment:${commentId}:likeCount`]);
                }
            }
        }

        console.log("[CommentLikeCron] Successfully synced comment likes from Redis to Postgres.");
    } catch (err) {
        console.error("[CommentLikeCron] Error syncing comment likes:", err);
    }
}

registerCronJob({
    name: "CommentLikeSync-Cron",
    schedule: "*/30 * * * *", // every 30 minutes
    task: syncCommentLikesFromRedis,
    replayMode: "parallel", // safe because comments are independent
});
