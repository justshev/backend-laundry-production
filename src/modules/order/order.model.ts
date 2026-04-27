import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export const orderModel = {
  countOrdersCreatedToday(gte: Date, lte: Date) {
    return prisma.order.count({
      where: {
        createdAt: {
          gte,
          lte,
        },
      },
    });
  },

  findBranchById(branchId: string) {
    return prisma.branch.findUnique({
      where: { id: branchId },
    });
  },

  findServicesByIds(serviceIds: string[]) {
    return prisma.laundryService.findMany({
      where: {
        id: {
          in: serviceIds,
        },
        deletedAt: null,
      },
      include: {
        branchLinks: true,
      },
    });
  },

  upsertCustomer(data: { name: string; phone: string; normalizedPhone: string }) {
    return prisma.customer.upsert({
      where: {
        normalizedPhone: data.normalizedPhone,
      },
      update: {
        name: data.name,
        phone: data.phone,
      },
      create: data,
    });
  },

  createOrder(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: {
        branch: true,
        items: true,
        statusHistories: {
          orderBy: {
            createdAt: "asc",
          },
        },
        ratings: true,
      },
    });
  },

  findOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        branch: true,
        items: true,
        statusHistories: {
          orderBy: {
            createdAt: "asc",
          },
        },
        ratings: true,
      },
    });
  },

  listOrders(where: Prisma.OrderWhereInput) {
    return prisma.order.findMany({
      where,
      include: {
        branch: true,
        items: true,
        statusHistories: {
          orderBy: {
            createdAt: "asc",
          },
        },
        ratings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  updateOrder(id: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        branch: true,
        items: true,
        statusHistories: {
          orderBy: {
            createdAt: "asc",
          },
        },
        ratings: true,
      },
    });
  },
};
