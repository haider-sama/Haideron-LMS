import { createClient, RedisClientType } from 'redis';
import { NODE_ENV, REDIS_HOSTNAME, REDIS_PASS, REDIS_PORT, REDIS_USERNAME } from '../constants/env';

const client: RedisClientType = createClient({
    username: REDIS_USERNAME,
    password: REDIS_PASS,
    socket: {
        host: REDIS_HOSTNAME,
        port: REDIS_PORT,
        tls: NODE_ENV === "production" ? true : undefined,
    }
});

client.on("error", (err: Error) => {
    console.error("Redis Client Error", err.message);
});

const baseDelay = 5000; // ms

export async function connectRedis() {
    let attempt = 0;

    while (true) {
        try {
            if (!client.isOpen) {
                console.time("Redis Connect Time");
                await client.connect();
                console.timeEnd("Redis Connect Time");

                if (NODE_ENV !== "production") {
                    await client.set("foo", "bar");
                    const result = await client.get("foo");
                    console.log("Redis test value:", result);
                }

                console.log("Redis connected");
            }
            break; // exit loop once connected
        } catch (err: any) {
            attempt++;
            console.error(
                `Redis connection failed (attempt ${attempt}): ${err.message}`
            );

            const wait = baseDelay * attempt; // backoff increases with attempts
            console.log(`Retrying Redis in ${wait / 1000}s...`);
            await new Promise((res) => setTimeout(res, wait));
        }
    }
}

export { client as redisClient, connectRedis };