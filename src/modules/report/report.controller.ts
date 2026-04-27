import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { reportService } from "./report.service";

function getActor(req: Request) {
  return {
    role: req.authUser!.role,
    branchId: req.authUser!.branchId,
  };
}

function getFilters(req: Request) {
  return {
    branchId: typeof req.query.branchId === "string" ? req.query.branchId : undefined,
    exactDate: typeof req.query.exactDate === "string" ? req.query.exactDate : undefined,
    startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined,
  };
}

export const reportController = {
  async dashboard(req: Request, res: Response) {
    const data = await reportService.getDashboard(getActor(req));
    return sendSuccess(res, { data });
  },

  async financial(req: Request, res: Response) {
    const data = await reportService.getFinancialReport(getActor(req), getFilters(req));
    return sendSuccess(res, { data });
  },

  async analytics(req: Request, res: Response) {
    const data = await reportService.getAnalyticsReport(getActor(req), getFilters(req));
    return sendSuccess(res, { data });
  },
};
