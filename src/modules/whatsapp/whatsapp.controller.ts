import { type Request, type Response } from "express";

import { env } from "../../config/env";
import { AppError } from "../../utils/http-error";
import { sendSuccess } from "../../utils/response";
import { whatsappService } from "./whatsapp.service";

export const whatsappController = {
  async verifyWebhook(req: Request, res: Response) {
    const secret = typeof req.query.secret === "string" ? req.query.secret : "";

    if (env.FONNTE_WEBHOOK_SECRET && secret !== env.FONNTE_WEBHOOK_SECRET) {
      throw new AppError("Webhook secret tidak valid", 401);
    }

    return sendSuccess(res, {
      message: "Webhook endpoint aktif",
      data: {
        ok: true,
      },
    });
  },

  async handleStatusWebhook(req: Request, res: Response) {
    const secret = typeof req.query.secret === "string" ? req.query.secret : "";

    if (env.FONNTE_WEBHOOK_SECRET && secret !== env.FONNTE_WEBHOOK_SECRET) {
      throw new AppError("Webhook secret tidak valid", 401);
    }

    const data = await whatsappService.handleStatusWebhook({
      id: typeof req.body.id === "string" ? req.body.id : undefined,
      stateid:
        typeof req.body.stateid === "string" ? req.body.stateid : undefined,
      status: typeof req.body.status === "string" ? req.body.status : undefined,
      state: typeof req.body.state === "string" ? req.body.state : undefined,
    });

    return sendSuccess(res, {
      message: "Webhook status Fonnte diproses",
      data,
    });
  },

  async handleIncomingWebhook(req: Request, res: Response) {
    const secret = typeof req.query.secret === "string" ? req.query.secret : "";

    if (env.FONNTE_WEBHOOK_SECRET && secret !== env.FONNTE_WEBHOOK_SECRET) {
      throw new AppError("Webhook secret tidak valid", 401);
    }

    const data = await whatsappService.handleIncomingWebhook(
      req.body as Record<string, unknown>,
    );

    return sendSuccess(res, {
      message: "Webhook inbound Fonnte diproses",
      data,
    });
  },
};
