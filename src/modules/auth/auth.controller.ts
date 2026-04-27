import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { authService } from "./auth.service";

export const authController = {
  async requestOtpLogin(req: Request, res: Response) {
    const data = await authService.requestOtpLogin(req.body);

    return sendSuccess(res, {
      status: 200,
      message: "Kode OTP berhasil dikirim",
      data,
    });
  },

  async verifyOtpLogin(req: Request, res: Response) {
    const data = await authService.verifyOtpLogin({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return sendSuccess(res, {
      status: 200,
      message: "Login berhasil",
      data,
    });
  },

  async refreshAccessToken(req: Request, res: Response) {
    const data = await authService.refreshAccessToken({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return sendSuccess(res, {
      status: 200,
      message: "Access token berhasil diperbarui",
      data,
    });
  },

  async logout(req: Request, res: Response) {
    const data = await authService.logout(req.body);

    return sendSuccess(res, {
      status: 200,
      message: "Logout berhasil",
      data,
    });
  },

  async me(req: Request, res: Response) {
    const data = await authService.getCurrentUser(req.authUser!.id);

    return sendSuccess(res, {
      status: 200,
      data,
    });
  },
};
