import {
  type WhatsAppRatingSessionState,
  type WhatsAppDeliveryStatus,
  type WhatsAppMessageDirection,
  type WhatsAppMessageType,
} from "@prisma/client";

import { prisma } from "../../lib/prisma";

interface CreateWhatsAppLogInput {
  type: WhatsAppMessageType;
  direction?: WhatsAppMessageDirection;
  targetPhone: string;
  normalizedPhone: string;
  message: string;
  orderId?: string;
  otpRequestId?: string;
  userId?: string;
  status?: WhatsAppDeliveryStatus;
}

export const whatsappModel = {
  createLog(input: CreateWhatsAppLogInput) {
    return prisma.whatsAppMessage.create({
      data: {
        type: input.type,
        direction: input.direction ?? "outbound",
        targetPhone: input.targetPhone,
        normalizedPhone: input.normalizedPhone,
        message: input.message,
        orderId: input.orderId,
        otpRequestId: input.otpRequestId,
        userId: input.userId,
        status: input.status ?? "pending",
      },
    });
  },

  updateLogAfterSend(
    id: string,
    input: {
      status: WhatsAppDeliveryStatus;
      providerRequestId?: number;
      providerMessageId?: string;
      errorMessage?: string;
      state?: string;
      sentAt?: Date;
      deliveredAt?: Date;
    },
  ) {
    return prisma.whatsAppMessage.update({
      where: { id },
      data: {
        status: input.status,
        providerRequestId: input.providerRequestId,
        providerMessageId: input.providerMessageId,
        errorMessage: input.errorMessage,
        state: input.state,
        sentAt: input.sentAt,
        deliveredAt: input.deliveredAt,
      },
    });
  },

  updateLogByProviderReference(input: {
    providerMessageId?: string;
    providerStateId?: string;
    providerStatus?: string;
    state?: string;
    status: WhatsAppDeliveryStatus;
    deliveredAt?: Date;
  }) {
    const conditions: Array<
      { providerMessageId: string } | { providerStateId: string }
    > = [];

    if (input.providerMessageId) {
      conditions.push({ providerMessageId: input.providerMessageId });
    }

    if (input.providerStateId) {
      conditions.push({ providerStateId: input.providerStateId });
    }

    return prisma.whatsAppMessage.updateMany({
      where: {
        OR: conditions,
      },
      data: {
        providerStateId: input.providerStateId,
        state: input.state,
        status: input.status,
        deliveredAt: input.deliveredAt,
      },
    });
  },

  upsertRatingSession(input: { orderId: string; normalizedPhone: string }) {
    return prisma.whatsAppRatingSession.upsert({
      where: {
        orderId: input.orderId,
      },
      update: {
        normalizedPhone: input.normalizedPhone,
        state: "waiting_rating",
        rating: null,
        completedAt: null,
      },
      create: {
        orderId: input.orderId,
        normalizedPhone: input.normalizedPhone,
        state: "waiting_rating",
      },
    });
  },

  findLatestActiveRatingSessionByPhone(normalizedPhone: string) {
    return prisma.whatsAppRatingSession.findFirst({
      where: {
        normalizedPhone,
        state: {
          in: ["waiting_rating", "waiting_feedback"],
        },
      },
      include: {
        order: {
          include: {
            ratings: true,
            branch: true,
            customer: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  updateRatingSession(
    id: string,
    input: {
      state?: WhatsAppRatingSessionState;
      rating?: number;
      completedAt?: Date;
    },
  ) {
    return prisma.whatsAppRatingSession.update({
      where: { id },
      data: {
        ...(input.state ? { state: input.state } : {}),
        ...(typeof input.rating === "number" ? { rating: input.rating } : {}),
        ...(input.completedAt ? { completedAt: input.completedAt } : {}),
      },
    });
  },

  upsertOrderRating(input: {
    orderId: string;
    customerId: string | null;
    branchId: string;
    customerName: string;
    branchName: string;
    rating: number;
    feedback?: string | null;
  }) {
    return prisma.rating.upsert({
      where: {
        orderId: input.orderId,
      },
      update: {
        customerId: input.customerId,
        branchId: input.branchId,
        customerName: input.customerName,
        branchName: input.branchName,
        rating: input.rating,
        ...(input.feedback !== undefined ? { feedback: input.feedback } : {}),
      },
      create: {
        order: {
          connect: {
            id: input.orderId,
          },
        },
        customer: input.customerId
          ? {
              connect: {
                id: input.customerId,
              },
            }
          : undefined,
        branch: {
          connect: {
            id: input.branchId,
          },
        },
        customerName: input.customerName,
        branchName: input.branchName,
        rating: input.rating,
        feedback: input.feedback ?? null,
      },
    });
  },
};
