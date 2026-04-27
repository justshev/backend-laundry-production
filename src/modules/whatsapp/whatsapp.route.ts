import { Router } from "express";

import { whatsappController } from "./whatsapp.controller";

export const whatsappRouter = Router();

whatsappRouter.get("/status", whatsappController.verifyWebhook);
whatsappRouter.post("/status", whatsappController.handleStatusWebhook);
whatsappRouter.get("/incoming", whatsappController.verifyWebhook);
whatsappRouter.post("/incoming", whatsappController.handleIncomingWebhook);
