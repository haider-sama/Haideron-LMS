import express from "express";
import dotenv from "dotenv";
import { authorizeRoles, optionalVerifyToken, verifyToken } from "../../../middleware/auth";
import { normalLimiter, safeLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";
import { forumController } from "../../../controllers";

dotenv.config();
const forumRouter = express.Router();

forumRouter.post(
    "/create",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.CommunityAdmin),
    forumController.createForum
);

forumRouter.get(
    "/",
    safeLimiter,
    optionalVerifyToken,
    forumController.getForums
);

forumRouter.get(
    "/:slug",
    safeLimiter,
    optionalVerifyToken,
    forumController.getForumBySlug
);

forumRouter.put(
    "/:forumId/update",
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
    forumController.updateForum
);

forumRouter.delete(
    "/:forumId/archive",
    strictLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.CommunityAdmin),
    forumController.archiveForum
);

forumRouter.patch(
    "/:forumId/restore",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.CommunityAdmin),
    forumController.restoreForum
);

forumRouter.patch(
    "/:forumId/status",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.CommunityAdmin),
    forumController.updateForumStatus
);

forumRouter.post(
    "/:forumId/upload/icon",
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
    forumController.uploadSingleIcon,
    forumController.uploadForumIcon
);

forumRouter.delete(
    "/:forumId/delete/icon",
    strictLimiter,
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
    forumController.deleteForumIcon
);

forumRouter.post(
    "/:forumId/moderators",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Admin,
        AudienceEnum.CommunityAdmin,
        AudienceEnum.ForumCurator
    ),
    forumController.assignModerator
);

forumRouter.delete(
    "/:forumId/moderators/:userId",
    normalLimiter,
    verifyToken,
    authorizeRoles(
        AudienceEnum.Admin,
        AudienceEnum.CommunityAdmin,
        AudienceEnum.ForumCurator
    ),
    forumController.removeModerator
);

export default forumRouter;