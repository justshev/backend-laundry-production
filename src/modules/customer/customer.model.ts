import { prisma } from "../../lib/prisma";

export const customerModel = {
  list(scopeBranchId?: string | null) {
    return prisma.customer.findMany({
      include: {
        orders: {
          where: scopeBranchId ? { branchId: scopeBranchId } : undefined,
          select: {
            id: true,
            code: true,
            customerName: true,
            customerPhone: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  },

  findById(id: string, scopeBranchId?: string | null) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          where: scopeBranchId ? { branchId: scopeBranchId } : undefined,
          select: {
            id: true,
            code: true,
            customerName: true,
            customerPhone: true,
            status: true,
            totalAmount: true,
            paymentMethod: true,
            createdAt: true,
            estimatedDoneAt: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  },
};
