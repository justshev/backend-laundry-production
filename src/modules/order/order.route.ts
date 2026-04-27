import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { orderController } from "./order.controller";
import {
  createOrderSchema,
  orderParamsSchema,
  orderQuerySchema,
  sendOrderWhatsAppSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
} from "./order.validation";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.get("/", validate({ query: orderQuerySchema }), orderController.list);
orderRouter.get(
  "/:id",
  validate({ params: orderParamsSchema }),
  orderController.getById,
);
orderRouter.post("/", validate({ body: createOrderSchema }), orderController.create);
orderRouter.patch(
  "/:id",
  validate({ params: orderParamsSchema, body: updateOrderSchema }),
  orderController.update,
);
orderRouter.patch(
  "/:id/status",
  validate({ params: orderParamsSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus,
);
orderRouter.post(
  "/:id/send-whatsapp",
  validate({ params: orderParamsSchema, body: sendOrderWhatsAppSchema }),
  orderController.sendWhatsApp,
);
