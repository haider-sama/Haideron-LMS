// src/controllers/index.ts

export * as facultyController from './core/faculty/faculty.controller';
export * as courseController from './core/course/course.controller';
export * as semesterController from './core/semester/semester.controller'
import * as peoController from "./core/program//peo.controller";
import * as ploController from "./core/program/plo.controller";
import * as programControl from "./core/program/program.controller";
export * as catalogueController from "./core/program/catalogue.controller";

export const programController = {
  ...peoController,
  ...ploController,
  ...programControl,
};