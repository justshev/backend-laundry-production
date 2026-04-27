import { z } from "zod";

export const requestOtpSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(6),
});

export const verifyOtpSchema = z.object({
  requestId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
