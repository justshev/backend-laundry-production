export const ORDER_STATUSES = [
  "Baru Masuk",
  "Diproses",
  "Dicuci",
  "Dikeringkan",
  "Disetrika",
  "Siap Diambil",
  "Sudah Diambil",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["Cash", "Transfer", "QRIS"] as const;

export const AUTO_NOTIFY_ORDER_STATUSES: ReadonlyArray<OrderStatus> = [
  "Siap Diambil",
  "Sudah Diambil",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}
