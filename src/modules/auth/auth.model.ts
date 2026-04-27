import { prisma } from "../../lib/prisma";

export const authModel = {
  findUserByIdentifier(email: string, normalizedPhone: string) {
    return prisma.user.findFirst({
      where: {
        OR: [{ email }, { normalizedPhone }],
      },
      include: {
        branch: true,
      },
    });
  },

  getLatestOtpRequest(userId: string) {
    return prisma.otpRequest.findFirst({
      where: {
        userId,
        purpose: "login",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  invalidatePendingOtpRequests(userId: string) {
    return prisma.otpRequest.updateMany({
      where: {
        userId,
        consumedAt: null,
        invalidatedAt: null,
        verifiedAt: null,
      },
      data: {
        invalidatedAt: new Date(),
      },
    });
  },

  createOtpRequest(input: {
    userId: string;
    codeHash: string;
    expiresAt: Date;
    maxAttempts: number;
  }) {
    return prisma.otpRequest.create({
      data: {
        userId: input.userId,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        maxAttempts: input.maxAttempts,
        lastSentAt: new Date(),
      },
    });
  },

  findOtpRequestById(id: string) {
    return prisma.otpRequest.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            branch: true,
          },
        },
      },
    });
  },

  updateOtpRequest(
    id: string,
    data: {
      attempts?: number;
      consumedAt?: Date;
      verifiedAt?: Date;
      invalidatedAt?: Date;
    },
  ) {
    return prisma.otpRequest.update({
      where: { id },
      data,
    });
  },

  storeRefreshToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({
      data: input,
    });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            branch: true,
          },
        },
      },
    });
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
      include: {
        branch: true,
      },
    });
  },

  findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
      },
    });
  },
};
