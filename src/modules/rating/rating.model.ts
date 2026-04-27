import { prisma } from "../../lib/prisma";

export const ratingModel = {
  list(branchId?: string) {
    return prisma.rating.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
