import express from "express";
import dotenv from "dotenv";
import { authorizeRoles, optionalVerifyToken, verifyToken } from "../../../middleware/auth";
import { normalLimiter, safeLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";
import { forumUserController } from "../../../controllers";

dotenv.config();
const forumUserRouter = express.Router();

forumUserRouter.get(
    "/info",
    safeLimiter,
    optionalVerifyToken,
    forumUserController.getForumFooterInfo
);


forumUserRouter.post(
    "/request",
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
    forumUserController.requestForumCreation
);

forumUserRouter.post(
    "/:forumId/join",
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
    forumUserController.joinForum
);

forumUserRouter.post(
    "/:forumId/leave",
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
    forumUserController.leaveForum
);

forumUserRouter.get(
    "/:forumId/membership-status",
    normalLimiter,
    optionalVerifyToken,
    forumUserController.getMembershipStatus
);

export default forumUserRouter;