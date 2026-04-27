import { z } from "zod";

export const updateSettingsSchema = z.object({
  businessName: z.string().trim().min(1).optional(),
  whatsappAutoNotifyEnabled: z.boolean().optional(),
  requestRatingEnabled: z.boolean().optional(),
  otpExpiryMinutes: z.coerce.number().int().positive().optional(),
  otpResendCooldownSeconds: z.coerce.number().int().nonnegative().optional(),
});
