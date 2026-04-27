import { prisma } from "../../lib/prisma";

export const serviceModel = {
  list() {
    return prisma.laundryService.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        branchLinks: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.laundryService.findUnique({
      where: { id },
      include: {
        branchLinks: {
          include: {
            branch: true,
          },
        },
      },
    });
  },

  countBranches(branchIds: string[]) {
    return prisma.branch.count({
      where: {
        id: {
          in: branchIds,
        },
      },
    });
  },

  create(input: {
    name: string;
    category: string;
    price: number;
    unit: string;
    durationLabel: string;
    estimatedDurationHours: number;
    status: "active" | "inactive";
    availableBranchIds: string[];
  }) {
    return prisma.laundryService.create({
      data: {
        name: input.name,
        category: input.category,
        price: input.price,
        unit: input.unit,
        durationLabel: input.durationLabel,
        estimatedDurationHours: input.estimatedDurationHours,
        status: input.status,
        branchLinks: {
          createMany: {
            data: input.availableBranchIds.map((branchId) => ({ branchId })),
          },
        },
      },
      include: {
        branchLinks: {
          include: {
            branch: true,
          },
        },
      },
    });
  },

  update(
    id: string,
    input: Partial<{
      name: string;
      category: string;
      price: number;
      unit: string;
      durationLabel: string;
      estimatedDurationHours: number;
      status: "active" | "inactive";
      availableBranchIds: string[];
      deletedAt: Date | null;
    }>,
  ) {
    const { availableBranchIds, ...data } = input;

    return prisma.laundryService.update({
      where: { id },
      data: {
        ...data,
        ...(availableBranchIds
          ? {
              branchLinks: {
                deleteMany: {},
                createMany: {
                  data: availableBranchIds.map((branchId) => ({ branchId })),
                },
              },
            }
          : {}),
      },
      include: {
        branchLinks: {
          include: {
            branch: true,
          },
        },
      },
    });
  },
};
