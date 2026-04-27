import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { staffService } from "./staff.service";

export const staffController = {
  async list(req: Request, res: Response) {
    const data = await staffService.listStaff();
    return sendSuccess(res, { data });
  },

  async create(req: Request, res: Response) {
    const data = await staffService.createStaff(req.body, req.authUser!.id);
    return sendSuccess(res, {
      status: 201,
      message: "Staff berhasil dibuat",
      data,
    });
  },

  async update(req: Request, res: Response) {
    const staffId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await staffService.updateStaff(
      staffId,
      req.body,
      req.authUser!.id,
    );

    return sendSuccess(res, {
      message: "Staff berhasil diperbarui",
      data,
    });
  },
};
