import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { branchService } from "./branch.service";

export const branchController = {
  async list(req: Request, res: Response) {
    const data = await branchService.listBranches();

    return sendSuccess(res, { data });
  },

  async create(req: Request, res: Response) {
    const data = await branchService.createBranch(req.body, req.authUser!.id);

    return sendSuccess(res, {
      status: 201,
      message: "Cabang berhasil dibuat",
      data,
    });
  },

  async update(req: Request, res: Response) {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await branchService.updateBranch(
      branchId,
      req.body,
      req.authUser!.id,
    );

    return sendSuccess(res, {
      message: "Cabang berhasil diperbarui",
      data,
    });
  },
};
