import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { reportController } from "./report.controller";
import { reportFiltersSchema } from "./report.validation";

export const dashboardRouter = Router();
export const reportRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get("/", reportController.dashboard);

reportRouter.use(requireAuth);
reportRouter.get(
  "/financial",
  validate({ query: reportFiltersSchema }),
  reportController.financial,
);
reportRouter.get(
  "/analytics",
  validate({ query: reportFiltersSchema }),
  reportController.analytics,
);
