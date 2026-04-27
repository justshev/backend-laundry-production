import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

interface CreateAuditLogInput {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description ?? undefined,
        metadata: input.metadata ?? undefined,
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    console.error("Gagal menyimpan audit log", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error,
    });

    return null;
  }
}
