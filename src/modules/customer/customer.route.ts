import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { customerController } from "./customer.controller";
import { customerParamsSchema, customerQuerySchema } from "./customer.validation";

export const customerRouter = Router();

customerRouter.use(requireAuth);

customerRouter.get("/", validate({ query: customerQuerySchema }), customerController.list);
customerRouter.get(
  "/:id/orders",
  validate({ params: customerParamsSchema }),
  customerController.getOrders,
);
