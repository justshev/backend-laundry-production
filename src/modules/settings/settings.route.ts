import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { settingsController } from "./settings.controller";
import { updateSettingsSchema } from "./settings.validation";

export const settingsRouter = Router();

settingsRouter.use(requireAuth, requireRole("super_admin"));

settingsRouter.get("/", settingsController.get);
settingsRouter.put(
  "/",
  validate({ body: updateSettingsSchema }),
  settingsController.update,
);
