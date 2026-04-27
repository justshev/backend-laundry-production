import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { orderService } from "./order.service";

function getActor(req: Request) {
  return {
    id: req.authUser!.id,
    role: req.authUser!.role,
    branchId: req.authUser!.branchId,
  };
}

export const orderController = {
  async list(req: Request, res: Response) {
    const data = await orderService.listOrders({
      actor: getActor(req),
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      branchId: typeof req.query.branchId === "string" ? req.query.branchId : undefined,
      exactDate: typeof req.query.exactDate === "string" ? req.query.exactDate : undefined,
      startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
      endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
    });

    return sendSuccess(res, { data });
  },

  async getById(req: Request, res: Response) {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await orderService.getOrderById(orderId, getActor(req));
    return sendSuccess(res, { data });
  },

  async create(req: Request, res: Response) {
    const data = await orderService.createOrder(req.body, getActor(req));
    return sendSuccess(res, {
      status: 201,
      message: "Order berhasil dibuat",
      data,
    });
  },

  async update(req: Request, res: Response) {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await orderService.updateOrder(orderId, req.body, getActor(req));
    return sendSuccess(res, {
      message: "Order berhasil diperbarui",
      data,
    });
  },

  async updateStatus(req: Request, res: Response) {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await orderService.updateOrderStatus(
      orderId,
      req.body,
      getActor(req),
    );
    return sendSuccess(res, {
      message: "Status order berhasil diperbarui",
      data,
    });
  },

  async sendWhatsApp(req: Request, res: Response) {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await orderService.sendOrderWhatsApp(
      orderId,
      req.body,
      getActor(req),
    );
    return sendSuccess(res, {
      message: "Notifikasi WhatsApp diproses",
      data,
    });
  },
};
