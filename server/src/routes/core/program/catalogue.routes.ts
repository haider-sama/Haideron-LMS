import express from "express";
import { authorizeRoles, verifyToken } from "../../../middleware/auth";
import { catalogueController } from "../../../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../../shared/enums";

dotenv.config();
const catalogueRouter = express.Router();

catalogueRouter.post(
    "/create",
    normalLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    catalogueController.createProgramCatalogue
);

catalogueRouter.get(
    "/",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    catalogueController.getCatalogues
);

catalogueRouter
    .get(
        "/:catalogueId",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        catalogueController.getCatalogueById
    ).put(
        "/:catalogueId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        catalogueController.updateCatalogueById
    ).delete(
        "/:catalogueId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        catalogueController.deleteCatalogueById
    );

export default catalogueRouter;