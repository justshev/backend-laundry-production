import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { ratingService } from "./rating.service";

export const ratingController = {
  async list(req: Request, res: Response) {
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const data = await ratingService.listRatings({
      branchId: branchId && branchId !== "all" ? branchId : undefined,
    });

    return sendSuccess(res, { data });
  },
};
