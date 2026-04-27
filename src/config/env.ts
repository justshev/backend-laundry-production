import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanValue = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined) return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      return ["1", "true", "yes", "on"].includes(value.toLowerCase());
    }

    return defaultValue;
  }, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_NAME: z.string().default("LaundryPro API"),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
  DATABASE_URL: z.string().default(
    "postgresql://postgres.[PROJECT-REF]:[DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require",
  ),
  DIRECT_URL: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? ""),
  JWT_ACCESS_SECRET: z.string().default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-me"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  OTP_EXPIRES_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),
  OTP_DEBUG_PREVIEW: booleanValue(true),
  FONNTE_BASE_URL: z.string().url().default("https://api.fonnte.com"),
  FONNTE_TOKEN: z.string().optional().transform((value) => value?.trim() ?? ""),
  FONNTE_COUNTRY_CODE: z.string().default("62"),
  FONNTE_WEBHOOK_SECRET: z.string().optional().transform((value) => value?.trim() ?? ""),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
