import { env } from "../config/env";

export function normalizePhone(phone: string, countryCode = env.FONNTE_COUNTRY_CODE) {
  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned) return "";
  if (countryCode === "0") return cleaned;
  if (cleaned.startsWith(countryCode)) return cleaned;
  if (cleaned.startsWith("0")) return `${countryCode}${cleaned.slice(1)}`;
  if (cleaned.startsWith("8")) return `${countryCode}${cleaned}`;

  return cleaned;
}

export function maskPhone(phone: string) {
  const normalized = normalizePhone(phone);

  if (normalized.length <= 6) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-3)}`;
}
