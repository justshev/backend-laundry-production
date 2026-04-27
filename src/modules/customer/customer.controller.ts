import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { customerService } from "./customer.service";

export const customerController = {
  async list(req: Request, res: Response) {
    const data = await customerService.listCustomers({
      scopeBranchId:
        req.authUser?.role === "staff_pos" ? req.authUser.branchId : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });

    return sendSuccess(res, { data });
  },

  async getOrders(req: Request, res: Response) {
    const customerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await customerService.getCustomerOrders({
      customerId,
      scopeBranchId:
        req.authUser?.role === "staff_pos" ? req.authUser.branchId : undefined,
    });

    return sendSuccess(res, { data });
  },
};
