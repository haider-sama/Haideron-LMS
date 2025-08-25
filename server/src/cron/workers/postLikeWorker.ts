import amqplib from "amqplib";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { posts } from "../../db/schema";
import { eq } from "drizzle-orm";
import { RABBITMQ_URL } from "../../constants/env";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const QUEUE_NAME = "post_likes";

async function startWorker() {
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log("[Worker] Listening for post like events...");

    channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());
            const { postId, userId, action } = event;

            // Optional: read current like count from Redis if needed
            // Or just increment/decrement DB safely
            const postRow = await db
                .select({ likeCount: posts.likeCount })
                .from(posts)
                .where(eq(posts.id, postId))
                .limit(1)
                .then(r => r[0]);

            if (!postRow) {
                console.warn(`[Worker] Post not found: ${postId}`);
                return channel.ack(msg);
            }

            let newCount = postRow.likeCount || 0;
            if (action === "like") newCount += 1;
            if (action === "unlike") newCount = Math.max(newCount - 1, 0);

            await db
                .update(posts)
                .set({ likeCount: newCount })
                .where(eq(posts.id, postId));

            channel.ack(msg); // acknowledge after success
        } catch (err) {
            console.error("[Worker] Error processing message:", err);
            // don't ack, RabbitMQ will retry
        }
    }, { noAck: false });
}

startWorker().catch(console.error);
