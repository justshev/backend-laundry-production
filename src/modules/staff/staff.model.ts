import { prisma } from "../../lib/prisma";

export const staffModel = {
  list() {
    return prisma.user.findMany({
      where: {
        role: "staff_pos",
      },
      include: {
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });
  },

  findByEmailOrPhone(input: {
    email?: string;
    normalizedPhone?: string;
    excludeId?: string;
  }) {
    const conditions: Array<{ email: string } | { normalizedPhone: string }> = [];

    if (input.email) {
      conditions.push({ email: input.email });
    }

    if (input.normalizedPhone) {
      conditions.push({ normalizedPhone: input.normalizedPhone });
    }

    if (conditions.length === 0) {
      return Promise.resolve(null);
    }

    return prisma.user.findFirst({
      where: {
        OR: conditions,
        ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      },
    });
  },

  create(data: {
    name: string;
    email: string;
    phone: string;
    normalizedPhone: string;
    passwordHash: string;
    role: "staff_pos";
    branchId: string;
    status: "active" | "inactive";
    avatar: string;
  }) {
    return prisma.user.create({
      data,
      include: {
        branch: true,
      },
    });
  },

  update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      normalizedPhone: string;
      passwordHash: string;
      branchId: string;
      status: "active" | "inactive";
      avatar: string;
    }>,
  ) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        branch: true,
      },
    });
  },
};
