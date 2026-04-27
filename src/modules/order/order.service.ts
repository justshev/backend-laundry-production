import { type Prisma } from "@prisma/client";

import {
  AUTO_NOTIFY_ORDER_STATUSES,
  type OrderStatus,
} from "../../constants/order-status";
import { createAuditLog } from "../../lib/audit";
import { AppError } from "../../utils/http-error";
import { buildOrderCode } from "../../utils/order-code";
import { normalizePhone } from "../../utils/phone";
import {
  addHours,
  buildDateRange,
  endOfDay,
  startOfDay,
} from "../../utils/datetime";
import { settingsModel } from "../settings/settings.model";
import {
  resolveOrderWhatsAppStatus,
  whatsappService,
} from "../whatsapp/whatsapp.service";
import { orderModel } from "./order.model";

interface Actor {
  id: string;
  role: "super_admin" | "staff_pos";
  branchId: string | null;
}

type OrderWithRelations =
  Awaited<ReturnType<typeof orderModel.findOrderById>> extends infer TResult
    ? NonNullable<TResult>
    : never;

function ensureOrderAccess(order: { branchId: string }, actor: Actor) {
  if (actor.role === "staff_pos" && actor.branchId !== order.branchId) {
    throw new AppError("Anda tidak memiliki akses ke order ini", 403);
  }
}

function resolveBranchId(branchId: string | undefined, actor: Actor) {
  if (actor.role === "staff_pos") {
    if (!actor.branchId) {
      throw new AppError("Staff belum memiliki cabang penugasan", 403);
    }

    return actor.branchId;
  }

  if (!branchId) {
    throw new AppError("Cabang order wajib dipilih", 422);
  }

  return branchId;
}

function serializeOrder(order: OrderWithRelations, whatsappStatus = "none") {
  const latestRating = order.ratings;

  return {
    id: order.id,
    code: order.code,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    branchId: order.branchId,
    branchName: order.branch.name,
    services: order.items.map((item) => ({
      name: item.serviceName,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      subtotal: item.subtotal,
    })),
    subtotalAmount: order.subtotalAmount,
    manualAdjustmentAmount: order.manualAdjustmentAmount,
    totalPrice: order.totalAmount,
    overrideReason: order.totalOverrideReason,
    status: order.status,
    paymentMethod: order.paymentMethod,
    whatsappStatus,
    createdAt: order.createdAt.toISOString(),
    estimatedDone: order.estimatedDoneAt?.toISOString() ?? null,
    pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
    statusHistory: order.statusHistories.map((history) => ({
      status: history.status,
      timestamp: history.createdAt.toISOString(),
      notes: history.notes,
    })),
    rating: latestRating?.rating ?? null,
    feedback: latestRating?.feedback ?? null,
  };
}

function buildOrderWhere(input: {
  actor: Actor;
  status?: string;
  branchId?: string;
  exactDate?: string;
  startDate?: string;
  endDate?: string;
}) {
  const dateRange = buildDateRange({
    exactDate: input.exactDate,
    startDate: input.startDate,
    endDate: input.endDate,
  });

  return {
    ...(input.actor.role === "staff_pos"
      ? { branchId: input.actor.branchId ?? undefined }
      : input.branchId
        ? { branchId: input.branchId }
        : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(dateRange.gte || dateRange.lte
      ? {
          createdAt: {
            ...(dateRange.gte ? { gte: dateRange.gte } : {}),
            ...(dateRange.lte ? { lte: dateRange.lte } : {}),
          },
        }
      : {}),
  } satisfies Prisma.OrderWhereInput;
}

export const orderService = {
  async listOrders(input: {
    actor: Actor;
    status?: string;
    search?: string;
    branchId?: string;
    exactDate?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where = buildOrderWhere(input);
    const orders = await orderModel.listOrders(where);
    const search = input.search?.toLowerCase() ?? "";

    const filteredOrders = search
      ? orders.filter(
          (order) =>
            order.code.toLowerCase().includes(search) ||
            order.customerName.toLowerCase().includes(search) ||
            order.customerPhone.includes(search),
        )
      : orders;

    const whatsappStatuses =
      await whatsappService.getLatestOrderMessageStatuses(
        filteredOrders.map((order) => order.id),
      );

    return filteredOrders.map((order) =>
      serializeOrder(order, whatsappStatuses.get(order.id) ?? "none"),
    );
  },

  async getOrderById(id: string, actor: Actor) {
    const order = await orderModel.findOrderById(id);
    if (!order) {
      throw new AppError("Order tidak ditemukan", 404);
    }

    ensureOrderAccess(order, actor);
    const whatsappStatuses =
      await whatsappService.getLatestOrderMessageStatuses([id]);
    return serializeOrder(order, whatsappStatuses.get(id) ?? "none");
  },

  async createOrder(
    data: {
      customerName?: string;
      customerPhone: string;
      branchId?: string;
      paymentMethod: string;
      items: Array<{ serviceId: string; qty: number }>;
    },
    actor: Actor,
  ) {
    const branchId = resolveBranchId(data.branchId, actor);
    const branch = await orderModel.findBranchById(branchId);

    if (!branch || branch.status !== "active") {
      throw new AppError("Cabang tidak ditemukan atau nonaktif", 404);
    }

    const services = await orderModel.findServicesByIds(
      data.items.map((item) => item.serviceId),
    );

    if (services.length !== data.items.length) {
      throw new AppError("Salah satu layanan tidak ditemukan", 404);
    }

    const serviceById = new Map(
      services.map((service) => [service.id, service]),
    );

    for (const item of data.items) {
      const service = serviceById.get(item.serviceId);
      if (!service || service.status !== "active") {
        throw new AppError("Salah satu layanan tidak aktif", 422);
      }

      if (!service.branchLinks.some((link) => link.branchId === branchId)) {
        throw new AppError(
          `Layanan ${service.name} tidak tersedia di cabang ini`,
          422,
        );
      }
    }

    const normalizedCustomerPhone = normalizePhone(data.customerPhone);
    const customerName = data.customerName?.trim() || "Pelanggan";
    const customer = await orderModel.upsertCustomer({
      name: customerName,
      phone: data.customerPhone.trim(),
      normalizedPhone: normalizedCustomerPhone,
    });

    const subtotalAmount = data.items.reduce((total, item) => {
      const service = serviceById.get(item.serviceId)!;
      return total + Math.round(service.price * item.qty);
    }, 0);

    const maxDurationHours = Math.max(
      ...data.items.map(
        (item) => serviceById.get(item.serviceId)!.estimatedDurationHours,
      ),
    );

    const now = new Date();
    const sequence =
      (await orderModel.countOrdersCreatedToday(
        startOfDay(now),
        endOfDay(now),
      )) + 1;

    const createdOrder = await orderModel.createOrder({
      code: buildOrderCode(sequence, now),
      customerName,
      customerPhone: data.customerPhone.trim(),
      normalizedCustomerPhone,
      paymentMethod: data.paymentMethod,
      status: "Baru Masuk",
      subtotalAmount,
      totalAmount: subtotalAmount,
      estimatedDoneAt: addHours(now, maxDurationHours),
      customer: {
        connect: {
          id: customer.id,
        },
      },
      branch: {
        connect: {
          id: branchId,
        },
      },
      ...(actor.id
        ? {
            createdByUser: {
              connect: {
                id: actor.id,
              },
            },
          }
        : {}),
      items: {
        create: data.items.map((item) => {
          const service = serviceById.get(item.serviceId)!;
          return {
            service: {
              connect: {
                id: service.id,
              },
            },
            serviceName: service.name,
            qty: item.qty,
            unit: service.unit,
            price: service.price,
            subtotal: Math.round(service.price * item.qty),
          };
        }),
      },
      statusHistories: {
        create: {
          status: "Baru Masuk",
          changedByUserId: actor.id,
          notes: "Order dibuat dari POS",
        },
      },
    });

    await createAuditLog({
      actorUserId: actor.id,
      action: "CREATE_ORDER",
      entityType: "Order",
      entityId: createdOrder.id,
      description: `Order ${createdOrder.code} dibuat`,
    });

    return serializeOrder(createdOrder);
  },

  async updateOrder(
    id: string,
    data: {
      customerName?: string;
      customerPhone?: string;
      paymentMethod?: string;
      totalAmount?: number;
      overrideReason?: string;
    },
    actor: Actor,
  ) {
    const order = await orderModel.findOrderById(id);
    if (!order) {
      throw new AppError("Order tidak ditemukan", 404);
    }

    ensureOrderAccess(order, actor);

    const nextCustomerName = data.customerName?.trim() ?? order.customerName;
    const nextCustomerPhone = data.customerPhone?.trim() ?? order.customerPhone;
    const nextNormalizedPhone = normalizePhone(nextCustomerPhone);

    const customer = await orderModel.upsertCustomer({
      name: nextCustomerName,
      phone: nextCustomerPhone,
      normalizedPhone: nextNormalizedPhone,
    });

    let manualAdjustmentAmount = order.manualAdjustmentAmount;
    let totalAmount = order.totalAmount;
    let totalOverrideReason = order.totalOverrideReason;

    if (typeof data.totalAmount === "number") {
      totalAmount = data.totalAmount;
      manualAdjustmentAmount = totalAmount - order.subtotalAmount;

      if (manualAdjustmentAmount !== 0 && !data.overrideReason?.trim()) {
        throw new AppError(
          "Alasan override total wajib diisi saat total diubah",
          422,
        );
      }

      totalOverrideReason =
        manualAdjustmentAmount !== 0 ? data.overrideReason!.trim() : null;
    }

    const updatedOrder = await orderModel.updateOrder(id, {
      customerName: nextCustomerName,
      customerPhone: nextCustomerPhone,
      normalizedCustomerPhone: nextNormalizedPhone,
      paymentMethod: data.paymentMethod,
      totalAmount,
      manualAdjustmentAmount,
      totalOverrideReason,
      customer: {
        connect: {
          id: customer.id,
        },
      },
    });

    await createAuditLog({
      actorUserId: actor.id,
      action:
        typeof data.totalAmount === "number"
          ? "OVERRIDE_ORDER_TOTAL"
          : "UPDATE_ORDER",
      entityType: "Order",
      entityId: id,
      description:
        typeof data.totalAmount === "number"
          ? `Total order ${updatedOrder.code} diubah dengan alasan: ${totalOverrideReason ?? "tanpa alasan"}`
          : `Order ${updatedOrder.code} diperbarui`,
    });

    const whatsappStatuses =
      await whatsappService.getLatestOrderMessageStatuses([id]);
    return serializeOrder(updatedOrder, whatsappStatuses.get(id) ?? "none");
  },

  async updateOrderStatus(
    id: string,
    data: {
      status: OrderStatus;
      notifyCustomer?: boolean;
    },
    actor: Actor,
  ) {
    const order = await orderModel.findOrderById(id);
    if (!order) {
      throw new AppError("Order tidak ditemukan", 404);
    }

    ensureOrderAccess(order, actor);

    const statusChanged = order.status !== data.status;
    const updatedOrder = statusChanged
      ? await orderModel.updateOrder(id, {
          status: data.status,
          ...(data.status === "Sudah Diambil"
            ? { pickedUpAt: new Date() }
            : {}),
          statusHistories: {
            create: {
              status: data.status,
              changedByUserId: actor.id,
              notes: "Status order diperbarui",
            },
          },
        })
      : order;

    const settings = await settingsModel.ensureSettings();
    const shouldAutoNotify =
      settings.whatsappAutoNotifyEnabled &&
      AUTO_NOTIFY_ORDER_STATUSES.includes(data.status);
    const shouldNotify = data.notifyCustomer ?? shouldAutoNotify;
    const shouldRequestRating =
      settings.requestRatingEnabled && data.status === "Sudah Diambil";

    const notification = shouldNotify
      ? await whatsappService.sendOrderStatusMessage({
          order: updatedOrder,
          status: data.status,
          userId: actor.id,
          requestRating: shouldRequestRating,
        })
      : { attempted: false, success: false, mocked: false };

    await createAuditLog({
      actorUserId: actor.id,
      action: "UPDATE_ORDER_STATUS",
      entityType: "Order",
      entityId: id,
      description: `Status ${updatedOrder.code} diubah ke ${data.status}`,
    });

    const whatsappStatuses =
      await whatsappService.getLatestOrderMessageStatuses([id]);
    return {
      order: serializeOrder(updatedOrder, whatsappStatuses.get(id) ?? "none"),
      notification,
    };
  },

  async sendOrderWhatsApp(
    id: string,
    data: { status?: OrderStatus },
    actor: Actor,
  ) {
    const order = await orderModel.findOrderById(id);
    if (!order) {
      throw new AppError("Order tidak ditemukan", 404);
    }

    ensureOrderAccess(order, actor);

    const settings = await settingsModel.ensureSettings();
    const requestedStatus = data.status ?? (order.status as OrderStatus);

    const notification = await whatsappService.sendOrderStatusMessage({
      order,
      status: requestedStatus,
      userId: actor.id,
      requestRating:
        settings.requestRatingEnabled && requestedStatus === "Sudah Diambil",
    });

    await createAuditLog({
      actorUserId: actor.id,
      action: "SEND_ORDER_WHATSAPP",
      entityType: "Order",
      entityId: id,
      description: `Notifikasi WhatsApp dikirim untuk order ${order.code}`,
    });

    return notification;
  },
};
