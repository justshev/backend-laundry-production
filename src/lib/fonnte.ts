import { randomUUID } from "node:crypto";

import { env } from "../config/env";
import { AppError } from "../utils/http-error";
import { normalizePhone } from "../utils/phone";

interface SendFonnteMessageInput {
  targetPhone: string;
  message: string;
  countryCode?: string;
}

export interface SendFonnteMessageResult {
  mocked: boolean;
  targetPhone: string;
  requestId?: number;
  messageId?: string;
  raw: unknown;
}

export function isFonnteConfigured() {
  return Boolean(env.FONNTE_TOKEN);
}

export async function sendFonnteMessage(
  input: SendFonnteMessageInput,
): Promise<SendFonnteMessageResult> {
  const normalizedPhone = normalizePhone(
    input.targetPhone,
    input.countryCode ?? env.FONNTE_COUNTRY_CODE,
  );

  if (!normalizedPhone) {
    throw new AppError("Nomor WhatsApp tidak valid", 400);
  }

  if (!isFonnteConfigured()) {
    if (env.NODE_ENV !== "production" || env.OTP_DEBUG_PREVIEW) {
      return {
        mocked: true,
        targetPhone: normalizedPhone,
        requestId: Date.now(),
        messageId: `mock-${randomUUID()}`,
        raw: { detail: "Mocked Fonnte response", status: true },
      };
    }

    throw new AppError("FONNTE_TOKEN belum dikonfigurasi", 500);
  }

  const formData = new FormData();
  formData.append("target", normalizedPhone);
  formData.append("message", input.message);
  formData.append("typing", "false");
  formData.append("countryCode", input.countryCode ?? env.FONNTE_COUNTRY_CODE);

  const response = await fetch(`${env.FONNTE_BASE_URL.replace(/\/$/, "")}/send`, {
    method: "POST",
    headers: {
      Authorization: env.FONNTE_TOKEN,
    },
    body: formData,
  });

  const rawText = await response.text();

  let parsed: unknown = rawText;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    parsed = rawText;
  }

  const parsedRecord = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  const failed = !response.ok || parsedRecord?.status === false || parsedRecord?.Status === false;

  if (failed) {
    const reason =
      typeof parsedRecord?.reason === "string"
        ? parsedRecord.reason
        : typeof parsedRecord?.detail === "string"
          ? parsedRecord.detail
          : "Gagal mengirim pesan ke Fonnte";

    throw new AppError(reason, 502, parsed);
  }

  const messageIds = Array.isArray(parsedRecord?.id) ? parsedRecord.id : [];

  return {
    mocked: false,
    targetPhone: normalizedPhone,
    requestId: typeof parsedRecord?.requestid === "number" ? parsedRecord.requestid : undefined,
    messageId: typeof messageIds[0] === "string" ? messageIds[0] : undefined,
    raw: parsed,
  };
}
