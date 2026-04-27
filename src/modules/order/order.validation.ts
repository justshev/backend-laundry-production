import { z } from "zod";

import { ORDER_STATUSES, PAYMENT_METHODS } from "../../constants/order-status";

export const orderParamsSchema = z.object({
  id: z.string().min(1),
});

export const createOrderSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().min(6),
  branchId: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("Cash"),
  items: z
    .array(
      z.object({
        serviceId: z.string().min(1),
        qty: z.coerce.number().positive(),
      }),
    )
    .min(1),
});

export const updateOrderSchema = z.object({
  customerName: z.string().trim().min(1).optional(),
  customerPhone: z.string().trim().min(6).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  totalAmount: z.coerce.number().int().nonnegative().optional(),
  overrideReason: z.string().trim().min(3).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  notifyCustomer: z.boolean().optional(),
});

export const sendOrderWhatsAppSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
});

export const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().optional(),
  branchId: z.string().trim().optional(),
  exactDate: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});
