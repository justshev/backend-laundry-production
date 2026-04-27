import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { serviceController } from "./service.controller";
import {
  createServiceSchema,
  serviceParamsSchema,
  updateServiceSchema,
} from "./service.validation";

export const serviceRouter = Router();

serviceRouter.use(requireAuth);

serviceRouter.get("/", serviceController.list);
serviceRouter.post(
  "/",
  requireRole("super_admin"),
  validate({ body: createServiceSchema }),
  serviceController.create,
);
serviceRouter.patch(
  "/:id",
  requireRole("super_admin"),
  validate({ params: serviceParamsSchema, body: updateServiceSchema }),
  serviceController.update,
);
serviceRouter.delete(
  "/:id",
  requireRole("super_admin"),
  validate({ params: serviceParamsSchema }),
  serviceController.remove,
);
