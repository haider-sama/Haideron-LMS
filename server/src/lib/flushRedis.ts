import { connectRedis, redisClient } from './redis';

(async () => {
    try {
        // Connect to Redis if not already connected
        if (!redisClient.isOpen) {
            await connectRedis();
        }

        // Flush the entire current Redis database
        await redisClient.flushDb();
        console.log("Redis database cleared!");

        // Close the Redis connection
        await redisClient.quit();
        console.log("Redis connection closed.");
    } catch (err) {
        console.error("Error flushing Redis:", err);
        process.exit(1);
    }
})();