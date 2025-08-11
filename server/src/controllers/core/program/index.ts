// src/controllers/core/program/index.ts

import * as peoController from "./peo.controller";
import * as ploController from "./plo.controller";
import * as programControl from "./program.controller";

export const programController = {
  ...peoController,
  ...ploController,
  ...programControl
};