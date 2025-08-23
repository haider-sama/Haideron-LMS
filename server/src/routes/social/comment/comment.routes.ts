import express from "express";
import dotenv from "dotenv";
import { authorizeRoles, optionalVerifyToken, verifyToken } from "../../../middleware/auth";
import { normalLimiter, safeLimiter } from "../../../utils/limiter/rateLimiter";
import { commentController } from "../../../controllers";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const commentRouter = express.Router();

commentRouter.post(
    "/create",
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
    commentController.createComment
);

commentRouter.get(
    "/:postId",
    safeLimiter,
    optionalVerifyToken,
    commentController.getCommentsForPost
);

commentRouter.get(
    "/:postId/comments/:parentId/replies",
    safeLimiter,
    optionalVerifyToken,
    commentController.getRepliesForComment
);

commentRouter.get(
    "/:commentId",
    safeLimiter,
    optionalVerifyToken,
    commentController.getCommentById
);

commentRouter.put(
    "/:commentId/update",
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
    commentController.updateComment
);

commentRouter.delete(
    "/:commentId/delete",
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
    commentController.deleteComment
);

commentRouter.post(
    "/:commentId/markBest",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Admin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
        AudienceEnum.CommunityAdmin
    ),
    commentController.toggleBestComment
);



export default commentRouter;