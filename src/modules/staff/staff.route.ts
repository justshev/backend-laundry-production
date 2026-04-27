import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { staffController } from "./staff.controller";
import {
  createStaffSchema,
  staffParamsSchema,
  updateStaffSchema,
} from "./staff.validation";

export const staffRouter = Router();

staffRouter.use(requireAuth, requireRole("super_admin"));

staffRouter.get("/", staffController.list);
staffRouter.post("/", validate({ body: createStaffSchema }), staffController.create);
staffRouter.patch(
  "/:id",
  validate({ params: staffParamsSchema, body: updateStaffSchema }),
  staffController.update,
);
