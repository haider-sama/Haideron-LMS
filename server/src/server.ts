import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from "cloudinary";
import { closeDb, connectToDatabase, db } from './db/db';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, FRONTEND_URL, PORT } from './constants/env';
import helmet from 'helmet';
import { connectRedis } from './lib/redis';
import { users } from './db/schema';
import authRouter from './routes/auth/auth.routes';
import adminRouter from './routes/admin/admin.routes';

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.disable('x-powered-by');

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

app.use('/api/v1/auth/', authRouter);
app.use('/api/v1/admin/', adminRouter);

const startServer = async () => {
    console.time("Total Startup Time");

    try {
        await connectToDatabase(); // Optional connection check
        // await connectRedis(); // If you're using Redis

        // Example: test DB query
        const firstUser = await db.select().from(users).limit(1);
        console.log(
            "Drizzle user model test:",
            firstUser.length ? firstUser[0] : "No users found"
        );

        const server = app.listen(PORT, () => {
            console.log(`Server running on PORT: ${PORT}`);
            console.timeEnd("Total Startup Time");
        });

        // Graceful shutdown on SIGINT / SIGTERM
        process.on("SIGINT", async () => {
            console.log("SIGINT received. Shutting down gracefully...");
            await closeDb();
            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });
        });

        process.on("SIGTERM", async () => {
            console.log("SIGTERM received. Shutting down gracefully...");
            await closeDb();
            server.close(() => {
                console.log("Server closed");
                process.exit(0);
            });
        });

    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();