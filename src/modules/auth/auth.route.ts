import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { authController } from "./auth.controller";
import {
  refreshTokenSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "./auth.validation";

export const authRouter = Router();

authRouter.post(
  "/request-otp",
  validate({ body: requestOtpSchema }),
  authController.requestOtpLogin,
);
authRouter.post(
  "/verify-otp",
  validate({ body: verifyOtpSchema }),
  authController.verifyOtpLogin,
);
authRouter.post(
  "/refresh",
  validate({ body: refreshTokenSchema }),
  authController.refreshAccessToken,
);
authRouter.post(
  "/logout",
  validate({ body: refreshTokenSchema }),
  authController.logout,
);
authRouter.get("/me", requireAuth, authController.me);
