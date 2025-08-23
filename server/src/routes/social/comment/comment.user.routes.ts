import express from "express";
import dotenv from "dotenv";
import { authorizeRoles, fastVerifyToken } from "../../../middleware/auth";
import { normalLimiter, safeLimiter } from "../../../utils/limiter/rateLimiter";
import { commentUserController } from "../../../controllers";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const commentUserRouter = express.Router();

commentUserRouter.post(
    "/:commentId/like",
    normalLimiter,
    fastVerifyToken,
    authorizeRoles(
        AudienceEnum.Student,
        AudienceEnum.DepartmentTeacher,
        AudienceEnum.DepartmentHead,
        AudienceEnum.Admin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
        AudienceEnum.CommunityAdmin
    ),
    commentUserController.likeComment
);

commentUserRouter.post(
    "/:commentId/unlike",
    normalLimiter,
    fastVerifyToken,
    authorizeRoles(
        AudienceEnum.Student,
        AudienceEnum.DepartmentTeacher,
        AudienceEnum.DepartmentHead,
        AudienceEnum.Admin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
        AudienceEnum.CommunityAdmin
    ),
    commentUserController.unlikeComment
);

export default commentUserRouter;