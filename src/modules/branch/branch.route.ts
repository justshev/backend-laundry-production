import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { branchController } from "./branch.controller";
import {
  branchParamsSchema,
  createBranchSchema,
  updateBranchSchema,
} from "./branch.validation";

export const branchRouter = Router();

branchRouter.use(requireAuth, requireRole("super_admin"));

branchRouter.get("/", branchController.list);
branchRouter.post("/", validate({ body: createBranchSchema }), branchController.create);
branchRouter.patch(
  "/:id",
  validate({ params: branchParamsSchema, body: updateBranchSchema }),
  branchController.update,
);
