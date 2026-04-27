import { Router } from "express";

import { authRouter } from "../modules/auth/auth.route";
import { branchRouter } from "../modules/branch/branch.route";
import { customerRouter } from "../modules/customer/customer.route";
import { orderRouter } from "../modules/order/order.route";
import { ratingRouter } from "../modules/rating/rating.route";
import { dashboardRouter, reportRouter } from "../modules/report/report.route";
import { serviceRouter } from "../modules/service/service.route";
import { settingsRouter } from "../modules/settings/settings.route";
import { staffRouter } from "../modules/staff/staff.route";
import { whatsappRouter } from "../modules/whatsapp/whatsapp.route";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/staff", staffRouter);
apiRouter.use("/branches", branchRouter);
apiRouter.use("/services", serviceRouter);
apiRouter.use("/customers", customerRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/ratings", ratingRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/webhooks/fonnte", whatsappRouter);
