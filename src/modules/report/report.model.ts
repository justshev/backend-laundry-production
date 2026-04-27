import { type Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export const reportModel = {
  getOrders(where: Prisma.OrderWhereInput) {
    return prisma.order.findMany({
      where,
      include: {
        branch: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  getRatings(where: Prisma.RatingWhereInput) {
    return prisma.rating.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  getBranches() {
    return prisma.branch.findMany({
      include: {
        _count: {
          select: {
            staff: true,
            orders: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  },
};
