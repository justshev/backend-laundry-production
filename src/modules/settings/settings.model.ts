import { prisma } from "../../lib/prisma";

export const settingsModel = {
  ensureSettings() {
    return prisma.appSetting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, requestRatingEnabled: true },
    });
  },

  update(
    data: Partial<{
      businessName: string;
      whatsappAutoNotifyEnabled: boolean;
      requestRatingEnabled: boolean;
      otpExpiryMinutes: number;
      otpResendCooldownSeconds: number;
      updatedByUserId: string;
    }>,
  ) {
    return prisma.appSetting.update({
      where: { id: 1 },
      data,
    });
  },
};
