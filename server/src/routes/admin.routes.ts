import express from "express";
import { authorizeRoles, verifyToken } from "../middleware/auth";
import { adminController } from "../controllers/admin";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../utils/limiter/rateLimiter";
import { AudienceEnum } from "../shared/enums";

dotenv.config();
const adminRouter = express.Router();

// Admin Routes
adminRouter.post(
    "/bulk-register",
    strictLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin),
    adminController.bulkRegister
);

adminRouter.route("/users")
    .get(
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin),
        adminController.fetchPaginatedUsers
    );

adminRouter.route("/users/:userId")
    .get(
        safeLimiter,
        verifyToken,
        adminController.fetchUserById
    )
    .delete(
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin),
        adminController.deleteUserById
    );

adminRouter.route("/users/:userId/update")
    .put(
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin),
        adminController.updateUserById
    );

adminRouter.route("/users/:userId/password-reset")
    .put(
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin),
        adminController.adminResetUserPassword
    );

export default adminRouter;