import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { serviceService } from "./service.service";

export const serviceController = {
  async list(req: Request, res: Response) {
    const data = await serviceService.listServices();
    return sendSuccess(res, { data });
  },

  async create(req: Request, res: Response) {
    const data = await serviceService.createService(req.body, req.authUser!.id);
    return sendSuccess(res, {
      status: 201,
      message: "Layanan berhasil dibuat",
      data,
    });
  },

  async update(req: Request, res: Response) {
    const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await serviceService.updateService(
      serviceId,
      req.body,
      req.authUser!.id,
    );
    return sendSuccess(res, {
      message: "Layanan berhasil diperbarui",
      data,
    });
  },

  async remove(req: Request, res: Response) {
    const serviceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await serviceService.deleteService(serviceId, req.authUser!.id);
    return sendSuccess(res, {
      message: "Layanan berhasil dihapus",
      data,
    });
  },
};
