import amqplib from "amqplib";
import { RABBITMQ_URL } from "../constants/env";

let channel: amqplib.Channel;

export const initRabbitMQ = async () => {
    const connection = await amqplib.connect(RABBITMQ_URL || "amqp://localhost");
    channel = await connection.createChannel();
    await channel.assertQueue("post_likes", { durable: true });
    console.log("RabbitMQ initialized.");
};

export const publishLikeEvent = async (event: { postId: string; userId: string }) => {
    if (!channel) throw new Error("RabbitMQ channel not initialized");
    channel.sendToQueue("post_likes", Buffer.from(JSON.stringify(event)), { persistent: true });
};