import { createAuditLog } from "../../lib/audit";
import { settingsModel } from "./settings.model";

function serializeSettings(settings: {
  businessName: string;
  whatsappAutoNotifyEnabled: boolean;
  requestRatingEnabled: boolean;
  otpExpiryMinutes: number;
  otpResendCooldownSeconds: number;
  updatedAt: Date;
}) {
  return {
    businessName: settings.businessName,
    whatsappAutoNotifyEnabled: settings.whatsappAutoNotifyEnabled,
    requestRatingEnabled: settings.requestRatingEnabled,
    otpExpiryMinutes: settings.otpExpiryMinutes,
    otpResendCooldownSeconds: settings.otpResendCooldownSeconds,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export const settingsService = {
  async getSettings() {
    const settings = await settingsModel.ensureSettings();
    return serializeSettings(settings);
  },

  async updateSettings(
    data: Partial<{
      businessName: string;
      whatsappAutoNotifyEnabled: boolean;
      requestRatingEnabled: boolean;
      otpExpiryMinutes: number;
      otpResendCooldownSeconds: number;
    }>,
    actorUserId: string,
  ) {
    await settingsModel.ensureSettings();
    const settings = await settingsModel.update({
      ...data,
      updatedByUserId: actorUserId,
    });

    await createAuditLog({
      actorUserId,
      action: "UPDATE_SETTINGS",
      entityType: "AppSetting",
      entityId: "1",
      description: "Pengaturan aplikasi diperbarui",
    });

    return serializeSettings(settings);
  },
};
