import express from "express";
import { authorizeRoles, verifyToken } from "../../middleware/auth";
import { programController } from "../../controllers";
import dotenv from "dotenv";
import { safeLimiter, normalLimiter, strictLimiter } from "../../utils/limiter/rateLimiter";
import { AudienceEnum } from "../../shared/enums";

dotenv.config();
const programRouter = express.Router();

programRouter
    .post(
        "/:programId/plos",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        programController.addPLOsToProgram
    ).get(
        "/:programId/plos",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead, AudienceEnum.DepartmentTeacher),
        programController.getPLOsForProgram
    );

programRouter
    .put(
        "/:programId/plos/:ploId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        programController.updatePLO
    )
    .delete(
        "/:programId/plos/:ploId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        programController.deletePLO
    );

programRouter
    .post(
        "/:programId/peos",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        programController.addPEOsToProgram
    ).get(
        "/:programId/peos",
        safeLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        programController.getPEOsForProgram
    );

programRouter
    .put(
        "/:programId/peos/:peoId",
        normalLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        programController.updatePEO
    )
    .delete(
        "/:programId/peos/:peoId",
        strictLimiter,
        verifyToken,
        authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
        programController.deletePEO
    );

programRouter.post(
    "/register",
    strictLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    programController.registerProgram
);

programRouter.get("/",
    safeLimiter,
    verifyToken,
    authorizeRoles("DepartmentHead", "Admin"),
    programController.getPrograms
);

programRouter.get(
    "/:programId",
    safeLimiter,
    verifyToken,
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    programController.getProgramById
);

programRouter.put(
    "/:programId", 
    normalLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    programController.updateProgramById
);

programRouter.delete(
    "/:programId", 
    strictLimiter, 
    verifyToken, 
    authorizeRoles(AudienceEnum.Admin, AudienceEnum.DepartmentHead),
    programController.deleteProgramById
);


export default programRouter;