import express from "express";
import dotenv from "dotenv";
import { authorizeRoles, optionalVerifyToken, verifyToken } from "../../../middleware/auth";
import { normalLimiter, safeLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";
import { forumUserController, postController } from "../../../controllers";

dotenv.config();
const postRouter = express.Router();

postRouter.post(
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
    postController.createPost
);

postRouter.get(
    "/",
    safeLimiter,
    optionalVerifyToken,
    postController.filterPosts
);

postRouter.get(
    "/forums/:forumId",
    safeLimiter,
    optionalVerifyToken,
    postController.filterPosts
);

postRouter.get(
    "/users/:userId",
    safeLimiter,
    optionalVerifyToken,
    postController.filterPosts
);

postRouter.get(
    "/:slug",
    safeLimiter,
    optionalVerifyToken,
    postController.getPostBySlug
);

postRouter.get(
    "/:postId", 
    safeLimiter, 
    optionalVerifyToken, 
    postController.getPostById
);

postRouter.put(
    "/:postId/update",
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
    postController.updatePost
);

postRouter.delete(
    "/:postId/archive",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Admin,
        AudienceEnum.CommunityAdmin,
        AudienceEnum.ForumCurator,
    ),
    postController.archivePost
);

postRouter.patch(
    "/:postId/restore",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Admin,
        AudienceEnum.CommunityAdmin,
        AudienceEnum.ForumCurator,
    ),
    postController.restorePost
);

postRouter.patch(
    "/:postId/pin",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Admin,
        AudienceEnum.CommunityAdmin,
        AudienceEnum.ForumModerator,
        AudienceEnum.ForumCurator,
    ),
    postController.togglePinPost
);

export default postRouter;