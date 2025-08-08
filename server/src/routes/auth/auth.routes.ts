import express from "express";
import { refreshToken, verifyToken } from "../../middleware/auth";
import { authController } from "../../controllers/auth";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../utils/limiter/rateLimiter";
import { loginWithGoogle } from "../../controllers/auth/oauth.controller";

dotenv.config();
const authRouter = express.Router();

authRouter.get("/validate-token", safeLimiter, verifyToken, authController.validateToken);
authRouter.post("/refresh-token", safeLimiter, refreshToken);

authRouter.get("/sessions", normalLimiter, verifyToken, authController.getUserSessions);
authRouter.delete("/sessions/:sessionId", normalLimiter, verifyToken, authController.deleteSession);

// Auth Routes
authRouter.route("/register").post(strictLimiter, authController.register);
authRouter.route("/login").post(strictLimiter, authController.login);
authRouter.route("/logout").post(safeLimiter, authController.logout);
authRouter.route("/logout-all").post(normalLimiter, verifyToken, authController.logoutFromAllDevices);

authRouter.route("/verify-email").post(strictLimiter, authController.verifyEmail);
authRouter.route("/resend-verification-email").post(strictLimiter, authController.resendVerificationEmail);

authRouter.route("/forgot-password").post(strictLimiter, authController.forgotPassword);
authRouter.route("/reset-password/:token").post(strictLimiter, authController.resetPassword);
authRouter.route("/resend-password-reset").post(strictLimiter, authController.resendPasswordResetEmail);

authRouter.route("/upload-avatar")
    .post(normalLimiter, verifyToken, authController.uploadSingleAvatar, authController.uploadAvatar);
authRouter.route("/delete/avatar").delete(normalLimiter, verifyToken, authController.deleteAvatar);

// User Profile Routes
authRouter.route("/profile").get(safeLimiter, verifyToken, authController.getUserProfile)
authRouter.route('/update/profile').put(normalLimiter, verifyToken, authController.updateUserProfile);
authRouter.route("/profile/:userIdOrUsername").get(normalLimiter, authController.getUserForumProfile);

authRouter.route("/login/google").post(safeLimiter, loginWithGoogle)

authRouter.route("/request-email-change").post(strictLimiter, verifyToken, authController.requestEmailChange);
authRouter.route("/verify-email-change").post(strictLimiter, authController.verifyEmailChange);

export default authRouter;