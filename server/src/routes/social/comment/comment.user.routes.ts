import express from "express";
import dotenv from "dotenv";
import { fastVerifyToken } from "../../../middleware/auth";
import { normalLimiter } from "../../../utils/limiter/rateLimiter";
import { commentUserController } from "../../../controllers";

dotenv.config();
const commentUserRouter = express.Router();

commentUserRouter.post(
    "/:commentId/like",
    normalLimiter,
    fastVerifyToken,
    commentUserController.likeComment
);

commentUserRouter.post(
    "/:commentId/unlike",
    normalLimiter,
    fastVerifyToken,
    commentUserController.unlikeComment
);

export default commentUserRouter;