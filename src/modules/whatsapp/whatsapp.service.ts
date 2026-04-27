import {
  type Order,
  type User,
  type WhatsAppDeliveryStatus,
  type WhatsAppMessageType,
} from "@prisma/client";

import { env } from "../../config/env";
import { sendFonnteMessage } from "../../lib/fonnte";
import { prisma } from "../../lib/prisma";
import { formatCurrency } from "../../utils/currency";
import { normalizePhone } from "../../utils/phone";
import { whatsappModel } from "./whatsapp.model";

interface OrderWithBranch extends Order {
  branch: {
    name: string;
  };
  items: Array<{
    serviceName: string;
    qty: number;
    unit: string;
  }>;
  ratings: {
    id: string;
  } | null;
}

interface IncomingWebhookPayload {
  sender?: string;
  message?: string;
  text?: string;
  data?: string;
  name?: string;
}

function mapFonnteStatusToDeliveryStatus(
  providerStatus?: string,
  state?: string,
): WhatsAppDeliveryStatus {
  const signature = `${providerStatus ?? ""} ${state ?? ""}`.toLowerCase();

  if (
    signature.includes("deliver") ||
    signature.includes("read") ||
    signature.includes("received")
  ) {
    return "delivered";
  }

  if (signature.includes("sent") || signature.includes("success")) {
    return "sent";
  }

  if (
    signature.includes("fail") ||
    signature.includes("reject") ||
    signature.includes("expired") ||
    signature.includes("cancel")
  ) {
    return "failed";
  }

  return "pending";
}

function buildOtpMessage(name: string, otpCode: string) {
  return [
    `Halo ${name},`,
    `Kode OTP login LaundryPro Anda adalah: ${otpCode}`,
    `Kode berlaku ${env.OTP_EXPIRES_MINUTES} menit dan jangan dibagikan ke siapa pun.`,
  ].join("\n");
}

function buildOrderItemsLabel(order: OrderWithBranch) {
  const items = order.items.map(
    (item) => `${item.serviceName} (${item.qty} ${item.unit})`,
  );

  if (items.length === 0) {
    return "pesanan laundry Anda";
  }

  if (items.length === 1) {
    return items[0];
  }

  return items.join(", ");
}

function buildOrderStatusMessage(order: OrderWithBranch, status: string) {
  const orderItemsLabel = buildOrderItemsLabel(order);

  if (status === "Siap Diambil") {
    return [
      `Halo ${order.customerName},`,
      `Pesanan ${orderItemsLabel} sudah siap diambil di ${order.branch.name}.`,
      `Total pembayaran: ${formatCurrency(order.totalAmount)}.`,
      "Terima kasih sudah menggunakan LaundryPro.",
    ].join("\n");
  }

  if (status === "Sudah Diambil") {
    return [
      `Halo ${order.customerName},`,
      `Pesanan ${orderItemsLabel} telah ditandai sudah diambil.`,
      "Semoga Anda puas dengan layanan LaundryPro.",
      "Terima kasih.",
    ].join("\n");
  }

  return [
    `Halo ${order.customerName},`,
    `Status pesanan ${orderItemsLabel} sekarang adalah: ${status}.`,
    "Terima kasih sudah menggunakan LaundryPro.",
  ].join("\n");
}

function buildRatingPrompt(orderCode: string) {
  return [
    "Terima kasih sudah memilih LaundryPro.",
    `Boleh bantu beri rating untuk order ${orderCode}?`,
    "Balas dengan angka 1 sampai 5.",
  ].join("\n");
}

function buildInvalidRatingMessage() {
  return "Rating tidak valid. Silakan balas dengan angka 1, 2, 3, 4, atau 5.";
}

function buildFeedbackPrompt(rating: number) {
  return [
    `Terima kasih, rating ${rating} sudah kami terima.`,
    "Mohon tulis feedback singkat tentang layanan kami.",
  ].join("\n");
}

function buildInvalidFeedbackMessage() {
  return "Feedback belum valid. Mohon kirim minimal 3 karakter agar kami bisa tindak lanjuti.";
}

function buildRatingThanksMessage() {
  return "Terima kasih, rating dan feedback Anda sudah kami simpan.";
}

function parseIncomingRating(message: string) {
  const match = message.trim().match(/^([1-5])$/);
  return match ? Number(match[1]) : null;
}

function sanitizeFeedback(message: string) {
  return message.trim().replace(/\s+/g, " ");
}

function extractIncomingPayload(
  input: Record<string, unknown>,
): IncomingWebhookPayload {
  return {
    sender:
      typeof input.sender === "string"
        ? input.sender
        : typeof input.from === "string"
          ? input.from
          : typeof input.number === "string"
            ? input.number
            : undefined,
    message:
      typeof input.message === "string"
        ? input.message
        : typeof input.text === "string"
          ? input.text
          : typeof input.data === "string"
            ? input.data
            : undefined,
    text: typeof input.text === "string" ? input.text : undefined,
    data: typeof input.data === "string" ? input.data : undefined,
    name: typeof input.name === "string" ? input.name : undefined,
  };
}

async function sendAndLogSystemMessage(input: {
  type: WhatsAppMessageType;
  targetPhone: string;
  normalizedPhone: string;
  message: string;
  orderId?: string;
}) {
  const log = await whatsappModel.createLog({
    type: input.type,
    targetPhone: input.targetPhone,
    normalizedPhone: input.normalizedPhone,
    message: input.message,
    orderId: input.orderId,
  });

  try {
    const result = await sendFonnteMessage({
      targetPhone: input.targetPhone,
      message: input.message,
    });

    await whatsappModel.updateLogAfterSend(log.id, {
      status: result.mocked ? "pending" : "sent",
      providerRequestId: result.requestId,
      providerMessageId: result.messageId,
      state: result.mocked ? "mocked" : "queued",
      sentAt: new Date(),
    });

    return {
      success: true,
      mocked: result.mocked,
    };
  } catch (error) {
    await whatsappModel.updateLogAfterSend(log.id, {
      status: "failed",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Gagal mengirim pesan WhatsApp",
    });

    return {
      success: false,
      mocked: false,
    };
  }
}

export function resolveOrderWhatsAppStatus(
  statuses: Array<{ status: WhatsAppDeliveryStatus }> | undefined,
) {
  return statuses && statuses.length > 0 ? statuses[0].status : "none";
}

export const whatsappService = {
  async sendOtpLoginMessage(input: {
    user: Pick<User, "id" | "name" | "phone">;
    otpRequestId: string;
    otpCode: string;
  }) {
    const message = buildOtpMessage(input.user.name, input.otpCode);
    const log = await whatsappModel.createLog({
      type: "otp_login",
      targetPhone: input.user.phone,
      normalizedPhone: normalizePhone(input.user.phone),
      message,
      otpRequestId: input.otpRequestId,
      userId: input.user.id,
    });

    try {
      const result = await sendFonnteMessage({
        targetPhone: input.user.phone,
        message,
      });

      await whatsappModel.updateLogAfterSend(log.id, {
        status: result.mocked ? "pending" : "sent",
        providerRequestId: result.requestId,
        providerMessageId: result.messageId,
        state: result.mocked ? "mocked" : "queued",
        sentAt: new Date(),
      });

      return result;
    } catch (error) {
      await whatsappModel.updateLogAfterSend(log.id, {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Gagal mengirim OTP",
      });
      throw error;
    }
  },

  async sendOrderStatusMessage(input: {
    order: OrderWithBranch;
    status: string;
    userId?: string;
    requestRating?: boolean;
  }) {
    const shouldRequestRating =
      Boolean(input.requestRating) &&
      input.status === "Sudah Diambil" &&
      !input.order.ratings;
    const message = shouldRequestRating
      ? `${buildOrderStatusMessage(input.order, input.status)}\n\n${buildRatingPrompt(input.order.code)}`
      : buildOrderStatusMessage(input.order, input.status);
    const type =
      input.status === "Siap Diambil"
        ? "order_status_ready"
        : input.status === "Sudah Diambil"
          ? "order_status_completed"
          : "manual_status_update";

    const log = await whatsappModel.createLog({
      type,
      targetPhone: input.order.customerPhone,
      normalizedPhone: normalizePhone(input.order.customerPhone),
      message,
      orderId: input.order.id,
      userId: input.userId,
    });

    try {
      const result = await sendFonnteMessage({
        targetPhone: input.order.customerPhone,
        message,
      });

      await whatsappModel.updateLogAfterSend(log.id, {
        status: result.mocked ? "pending" : "sent",
        providerRequestId: result.requestId,
        providerMessageId: result.messageId,
        state: result.mocked ? "mocked" : "queued",
        sentAt: new Date(),
      });

      if (shouldRequestRating) {
        await whatsappModel.upsertRatingSession({
          orderId: input.order.id,
          normalizedPhone: normalizePhone(input.order.customerPhone),
        });
      }

      return {
        attempted: true,
        success: true,
        mocked: result.mocked,
      };
    } catch (error) {
      await whatsappModel.updateLogAfterSend(log.id, {
        status: "failed",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Gagal mengirim notifikasi status",
      });

      return {
        attempted: true,
        success: false,
        mocked: false,
        error:
          error instanceof Error ? error.message : "Gagal mengirim notifikasi",
      };
    }
  },

  async handleStatusWebhook(input: {
    id?: string;
    stateid?: string;
    status?: string;
    state?: string;
  }) {
    const deliveryStatus = mapFonnteStatusToDeliveryStatus(
      input.status,
      input.state,
    );

    await whatsappModel.updateLogByProviderReference({
      providerMessageId: input.id,
      providerStateId: input.stateid,
      providerStatus: input.status,
      state: input.state,
      status: deliveryStatus,
      deliveredAt: deliveryStatus === "delivered" ? new Date() : undefined,
    });

    return {
      status: deliveryStatus,
      updatedAt: new Date().toISOString(),
    };
  },

  async handleIncomingWebhook(payload: Record<string, unknown>) {
    const incoming = extractIncomingPayload(payload);
    const normalizedPhone = incoming.sender
      ? normalizePhone(incoming.sender)
      : "";
    const inboundMessage = incoming.message?.trim() ?? "";

    if (!normalizedPhone || !inboundMessage) {
      return {
        processed: false,
        reason: "invalid_payload",
      };
    }

    const session =
      await whatsappModel.findLatestActiveRatingSessionByPhone(normalizedPhone);

    await whatsappModel.createLog({
      type: "rating_follow_up",
      direction: "inbound",
      targetPhone: incoming.sender ?? normalizedPhone,
      normalizedPhone,
      message: inboundMessage,
      orderId: session?.orderId,
      status: "delivered",
    });

    if (!session) {
      return {
        processed: false,
        reason: "no_active_session",
      };
    }

    if (session.state === "waiting_rating") {
      const rating = parseIncomingRating(inboundMessage);

      if (!rating) {
        await sendAndLogSystemMessage({
          type: "rating_follow_up",
          targetPhone: incoming.sender ?? normalizedPhone,
          normalizedPhone,
          message: buildInvalidRatingMessage(),
          orderId: session.orderId,
        });

        return {
          processed: true,
          stage: "rating",
          valid: false,
        };
      }

      await whatsappModel.upsertOrderRating({
        orderId: session.orderId,
        customerId: session.order.customerId,
        branchId: session.order.branchId,
        customerName: session.order.customerName,
        branchName: session.order.branch.name,
        rating,
        feedback: null,
      });

      await whatsappModel.updateRatingSession(session.id, {
        state: "waiting_feedback",
        rating,
      });

      await sendAndLogSystemMessage({
        type: "rating_follow_up",
        targetPhone: incoming.sender ?? normalizedPhone,
        normalizedPhone,
        message: buildFeedbackPrompt(rating),
        orderId: session.orderId,
      });

      return {
        processed: true,
        stage: "rating",
        valid: true,
        rating,
      };
    }

    const feedback = sanitizeFeedback(inboundMessage);
    if (feedback.length < 3) {
      await sendAndLogSystemMessage({
        type: "rating_follow_up",
        targetPhone: incoming.sender ?? normalizedPhone,
        normalizedPhone,
        message: buildInvalidFeedbackMessage(),
        orderId: session.orderId,
      });

      return {
        processed: true,
        stage: "feedback",
        valid: false,
      };
    }

    const finalRating = session.rating;
    if (!finalRating || finalRating < 1 || finalRating > 5) {
      await whatsappModel.updateRatingSession(session.id, {
        state: "waiting_rating",
      });

      await sendAndLogSystemMessage({
        type: "rating_follow_up",
        targetPhone: incoming.sender ?? normalizedPhone,
        normalizedPhone,
        message: buildInvalidRatingMessage(),
        orderId: session.orderId,
      });

      return {
        processed: true,
        stage: "feedback",
        valid: false,
        reason: "missing_rating",
      };
    }

    await whatsappModel.upsertOrderRating({
      orderId: session.orderId,
      customerId: session.order.customerId,
      branchId: session.order.branchId,
      customerName: session.order.customerName,
      branchName: session.order.branch.name,
      rating: finalRating,
      feedback,
    });

    await whatsappModel.updateRatingSession(session.id, {
      state: "completed",
      completedAt: new Date(),
    });

    await sendAndLogSystemMessage({
      type: "rating_follow_up",
      targetPhone: incoming.sender ?? normalizedPhone,
      normalizedPhone,
      message: buildRatingThanksMessage(),
      orderId: session.orderId,
    });

    return {
      processed: true,
      stage: "feedback",
      valid: true,
      rating: finalRating,
    };
  },

  async getLatestOrderMessageStatuses(orderIds: string[]) {
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
      select: {
        orderId: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const latestByOrderId = new Map<string, WhatsAppDeliveryStatus>();

    for (const message of messages) {
      if (!message.orderId || latestByOrderId.has(message.orderId)) {
        continue;
      }

      latestByOrderId.set(message.orderId, message.status);
    }

    return latestByOrderId;
  },
};
