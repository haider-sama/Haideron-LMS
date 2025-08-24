import express from "express";
import dotenv from "dotenv";
import { authorizeRoles, optionalVerifyToken, verifyToken } from "../../../middleware/auth";
import { normalLimiter, safeLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";
import { postUserController } from "../../../controllers";

dotenv.config();
const postUserRouter = express.Router();

postUserRouter.post(
    "/:postId/like",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Guest,
        AudienceEnum.Student,
        AudienceEnum.DepartmentTeacher,
        AudienceEnum.DepartmentHead,
        AudienceEnum.Admin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
        AudienceEnum.CommunityAdmin
    ),
    postUserController.likePost
);

postUserRouter.delete(
    "/:postId/unlike",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Guest,
        AudienceEnum.Student,
        AudienceEnum.DepartmentTeacher,
        AudienceEnum.DepartmentHead,
        AudienceEnum.Admin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
        AudienceEnum.CommunityAdmin
    ),
    postUserController.unlikePost
);

postUserRouter.post(
    "/:postId/upvote",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Student,
        AudienceEnum.DepartmentTeacher,
        AudienceEnum.DepartmentHead,
        AudienceEnum.Admin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
        AudienceEnum.CommunityAdmin
    ),
    postUserController.upvotePost
);

postUserRouter.post(
    "/:postId/downvote",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Student,
        AudienceEnum.DepartmentTeacher,
        AudienceEnum.DepartmentHead,
        AudienceEnum.Admin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
        AudienceEnum.CommunityAdmin
    ),
    postUserController.downvotePost
);

postUserRouter.get(
    "/:postId/metrics",
    optionalVerifyToken,
    postUserController.getPostMetrics
);

export default postUserRouter;