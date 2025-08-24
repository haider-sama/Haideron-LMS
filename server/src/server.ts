import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from "cloudinary";
import { closeDb, connectToDatabase, db } from './db/db';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME, FRONTEND_URL, PORT } from './constants/env';
import helmet from 'helmet';
import { users } from './db/schema';
import authRouter from './routes/auth.routes';
import adminRouter from './routes/admin.routes';
import facultyRouter from './routes/core/faculty.routes';
import courseRouter from './routes/core/course.routes';
import programRouter from './routes/core/program/program.routes';
import catalogueRouter from './routes/core/program/catalogue.routes';
import semesterRouter from './routes/core/semester.routes';
import batchRouter from './routes/core/batch/batch.routes';
import batchSemesterRouter from './routes/core/batch/batch.semester.routes';
import courseOfferingRouter from './routes/core/batch/course.offering.routes';
import batchEnrollmentRouter from './routes/core/batch/batch.enrollment.routes';
import studentRouter from './routes/core/student.routes';
import teacherRouter from './routes/core/teacher/teacher.routes';
import attendanceRouter from './routes/core/teacher/attendance.routes';
import assessmentRouter from './routes/core/teacher/assessment.routes';
import resultRouter from './routes/core/teacher/result.routes';
import { catchMissedJobs, startCronJobs } from './cron';
import auditLogRouter from './routes/audit.log.routes';
import { connectRedis, redisClient } from './lib/redis';
import { SettingsService } from './utils/settings/SettingsService';
import client from "prom-client";
import { authorizeRoles } from './middleware/auth';
import { AudienceEnum } from './shared/enums';
import forumRouter from './routes/social/forum/forum.routes';
import forumUserRouter from './routes/social/forum/forum.user.routes';
import postRouter from './routes/social/post/post.routes';
import postUserRouter from './routes/social/post/post.user.routes';
import commentRouter from './routes/social/comment/comment.routes';
import commentUserRouter from './routes/social/comment/comment.user.routes';

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.disable('x-powered-by');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

app.use('/api/v1/auth/', authRouter);
app.use('/api/v1/admin/', adminRouter);

app.use('/api/v1/program/', programRouter);
app.use('/api/v1/catalogue/', catalogueRouter);
app.use('/api/v1/semester/', semesterRouter);
app.use('/api/v1/course/', courseRouter);
app.use('/api/v1/faculty/', facultyRouter);

app.use('/api/v1/batch/', batchRouter);
app.use('/api/v1/batch/semesters/', batchSemesterRouter);
app.use('/api/v1/batch/enrollments/', batchEnrollmentRouter);
app.use('/api/v1/offerings/', courseOfferingRouter);

app.use('/api/v1/student/', studentRouter);
app.use('/api/v1/teacher/', teacherRouter);
app.use('/api/v1/attendance/', attendanceRouter);
app.use('/api/v1/assessment/', assessmentRouter);
app.use('/api/v1/results/', resultRouter);

app.use('/api/v1/audit-logs/', auditLogRouter);


app.use('/api/v1/forums/', forumRouter);
app.use('/api/v1/forums/public/', forumUserRouter);
app.use('/api/v1/posts/', postRouter);
app.use('/api/v1/posts/public/', postUserRouter);
app.use('/api/v1/comments/', commentRouter);
app.use('/api/v1/comments/public/', commentUserRouter);

app.get("/healthz", authorizeRoles(AudienceEnum.Admin), (req, res) => res.status(200).send("ok"));
app.get("/readyz", authorizeRoles(AudienceEnum.Admin), async (req, res) => {
    try {
        // DB check
        await db.execute("SELECT 1");

        // Redis check
        if (!redisClient.isOpen) {
            throw new Error("Redis not connected");
        }

        res.status(200).send("ready");
    } catch (err: any) {
        res.status(500).send("not ready: " + err.message);
    }
});

if (process.env.NODE_ENV === "production") {
    app.get("/metrics", authorizeRoles(AudienceEnum.Admin), async (req, res) => {
        res.set("Content-Type", client.register.contentType);
        res.end(await client.register.metrics());
    });
} else {
    app.get("/metrics", async (req, res) => {
        res.set("Content-Type", client.register.contentType);
        res.end(await client.register.metrics());
    });
}

const startServer = async () => {
    console.time("Total Startup Time");

    try {
        await connectToDatabase();  // Optional connection check
        await connectRedis();
        SettingsService.invalidateCache();  // whenever admin updates settings in DB

        // Example: test DB query
        // const firstUser = await db.select().from(users).limit(1);
        // console.log(
        //     "Drizzle user model test:",
        //     firstUser.length ? firstUser[0] : "No users found"
        // );

        startCronJobs();            // Start cron jobs
        await catchMissedJobs();    // Catch up on missed jobs (safety net)

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