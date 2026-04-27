import { prisma } from "../../lib/prisma";

export const branchModel = {
  list() {
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

  findById(id: string) {
    return prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            staff: true,
            orders: true,
          },
        },
      },
    });
  },

  findByName(name: string) {
    return prisma.branch.findUnique({
      where: { name },
    });
  },

  create(data: {
    name: string;
    address: string;
    phone: string;
    hours: string;
    status: "active" | "inactive";
  }) {
    return prisma.branch.create({
      data,
    });
  },

  update(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      phone: string;
      hours: string;
      status: "active" | "inactive";
    }>,
  ) {
    return prisma.branch.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            staff: true,
            orders: true,
          },
        },
      },
    });
  },
};
