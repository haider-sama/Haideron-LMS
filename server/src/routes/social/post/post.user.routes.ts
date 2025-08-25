import express from "express";
import dotenv from "dotenv";
import { fastVerifyToken, optionalVerifyToken } from "../../../middleware/auth";
import { normalLimiter, safeLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { postUserController } from "../../../controllers";

dotenv.config();
const postUserRouter = express.Router();

postUserRouter.post(
    "/:postId/like",
    normalLimiter,
    fastVerifyToken,
    postUserController.likePost
);

postUserRouter.delete(
    "/:postId/unlike",
    normalLimiter,
    fastVerifyToken,
    postUserController.unlikePost
);

postUserRouter.post(
    "/:postId/upvote",
    normalLimiter,
    fastVerifyToken,
    postUserController.upvotePost
);

postUserRouter.post(
    "/:postId/downvote",
    normalLimiter,
    fastVerifyToken,
    postUserController.downvotePost
);

postUserRouter.get(
    "/:postId/metrics",
    optionalVerifyToken,
    postUserController.getPostMetrics
);

export default postUserRouter;