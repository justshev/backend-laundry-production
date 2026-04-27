import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { ratingController } from "./rating.controller";
import { ratingQuerySchema } from "./rating.validation";

export const ratingRouter = Router();

ratingRouter.use(requireAuth, requireRole("super_admin"));

ratingRouter.get("/", validate({ query: ratingQuerySchema }), ratingController.list);
