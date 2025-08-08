import { createClient, RedisClientType } from 'redis';
import { NODE_ENV, REDIS_HOSTNAME, REDIS_PASS, REDIS_PORT, REDIS_USERNAME } from '../constants/env';

const client: RedisClientType = createClient({
    username: REDIS_USERNAME,
    password: REDIS_PASS,
    socket: {
        host: REDIS_HOSTNAME,
        port: REDIS_PORT
    }
});

client.on('error', (err: Error) => {
    console.log('Redis Client Error', err);
});

async function connectRedis() {
    if (!client.isOpen) {
        console.time("Redis Connect Time");
        await client.connect();
        console.timeEnd("Redis Connect Time");

        if (NODE_ENV !== 'production') {
            await client.set('foo', 'bar');
            const result = await client.get('foo');
            console.log("Redis test value:", result);
        }

        console.log('Redis connected');
    }
}

export { client as redisClient, connectRedis };