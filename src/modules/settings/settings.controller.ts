import { type Request, type Response } from "express";

import { sendSuccess } from "../../utils/response";
import { settingsService } from "./settings.service";

export const settingsController = {
  async get(req: Request, res: Response) {
    const data = await settingsService.getSettings();
    return sendSuccess(res, { data });
  },

  async update(req: Request, res: Response) {
    const data = await settingsService.updateSettings(req.body, req.authUser!.id);
    return sendSuccess(res, {
      message: "Pengaturan berhasil diperbarui",
      data,
    });
  },
};
