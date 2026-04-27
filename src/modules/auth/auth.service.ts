import { env } from "../../config/env";
import { createAuditLog } from "../../lib/audit";
import { AppError } from "../../utils/http-error";
import { compareOtp, generateOtpCode, hashOtp } from "../../utils/otp";
import { comparePassword } from "../../utils/password";
import { maskPhone, normalizePhone } from "../../utils/phone";
import { sendSuccess } from "../../utils/response";
import { addDurationToDate } from "../../utils/datetime";
import {
  createAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../utils/token";
import { serializeUser } from "../../utils/user";
import { whatsappService } from "../whatsapp/whatsapp.service";
import { authModel } from "./auth.model";

function buildRefreshTokenExpiryDate() {
  return addDurationToDate(new Date(), env.JWT_REFRESH_EXPIRES_IN);
}

async function createLoginSession(input: {
  userId: string;
  role: "super_admin" | "staff_pos";
  branchId: string | null;
  userAgent?: string;
  ipAddress?: string;
}) {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  await authModel.storeRefreshToken({
    userId: input.userId,
    tokenHash: refreshTokenHash,
    expiresAt: buildRefreshTokenExpiryDate(),
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  const accessToken = createAccessToken({
    sub: input.userId,
    role: input.role,
    branchId: input.branchId,
  });

  return {
    accessToken,
    refreshToken,
  };
}

export const authService = {
  async requestOtpLogin(input: {
    identifier: string;
    password: string;
  }) {
    const normalizedIdentifier = input.identifier.trim().toLowerCase();
    const normalizedPhone = normalizePhone(input.identifier);

    const user = await authModel.findUserByIdentifier(
      normalizedIdentifier,
      normalizedPhone,
    );

    if (!user) {
      throw new AppError("Email/nomor telepon atau password salah", 401);
    }

    const validPassword = await comparePassword(input.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError("Email/nomor telepon atau password salah", 401);
    }

    if (user.status !== "active") {
      throw new AppError("Akun nonaktif. Hubungi super admin.", 403);
    }

    const latestOtpRequest = await authModel.getLatestOtpRequest(user.id);
    if (
      latestOtpRequest?.lastSentAt &&
      new Date(latestOtpRequest.lastSentAt).getTime() +
        env.OTP_RESEND_COOLDOWN_SECONDS * 1000 >
        Date.now()
    ) {
      throw new AppError(
        `Tunggu ${env.OTP_RESEND_COOLDOWN_SECONDS} detik sebelum meminta OTP baru`,
        429,
      );
    }

    await authModel.invalidatePendingOtpRequests(user.id);

    const otpCode = generateOtpCode();
    const otpRequest = await authModel.createOtpRequest({
      userId: user.id,
      codeHash: hashOtp(otpCode),
      expiresAt: addDurationToDate(
        new Date(),
        `${env.OTP_EXPIRES_MINUTES}m`,
      ),
      maxAttempts: env.OTP_MAX_ATTEMPTS,
    });

    await whatsappService.sendOtpLoginMessage({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      otpRequestId: otpRequest.id,
      otpCode,
    });

    return {
      requestId: otpRequest.id,
      maskedPhone: maskPhone(user.phone),
      expiresAt: otpRequest.expiresAt.toISOString(),
      ...(env.OTP_DEBUG_PREVIEW ? { otpPreview: otpCode } : {}),
    };
  },

  async verifyOtpLogin(input: {
    requestId: string;
    otp: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const otpRequest = await authModel.findOtpRequestById(input.requestId);

    if (!otpRequest) {
      throw new AppError("Permintaan OTP tidak ditemukan", 404);
    }

    if (otpRequest.invalidatedAt || otpRequest.consumedAt || otpRequest.verifiedAt) {
      throw new AppError("OTP sudah tidak berlaku", 400);
    }

    if (otpRequest.expiresAt.getTime() < Date.now()) {
      await authModel.updateOtpRequest(otpRequest.id, {
        invalidatedAt: new Date(),
      });
      throw new AppError("Kode OTP sudah kedaluwarsa", 400);
    }

    if (otpRequest.attempts >= otpRequest.maxAttempts) {
      await authModel.updateOtpRequest(otpRequest.id, {
        invalidatedAt: new Date(),
      });
      throw new AppError("Batas percobaan OTP terlampaui", 400);
    }

    const validOtp = compareOtp(input.otp, otpRequest.codeHash);

    if (!validOtp) {
      const nextAttempts = otpRequest.attempts + 1;
      await authModel.updateOtpRequest(otpRequest.id, {
        attempts: nextAttempts,
        ...(nextAttempts >= otpRequest.maxAttempts
          ? { invalidatedAt: new Date() }
          : {}),
      });

      throw new AppError("Kode OTP tidak sesuai", 400);
    }

    if (otpRequest.user.status !== "active") {
      throw new AppError("Akun nonaktif. Hubungi super admin.", 403);
    }

    await authModel.updateOtpRequest(otpRequest.id, {
      verifiedAt: new Date(),
      consumedAt: new Date(),
    });

    const user = await authModel.updateLastLogin(otpRequest.user.id);

    const tokens = await createLoginSession({
      userId: user.id,
      role: user.role,
      branchId: user.branchId ?? null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    await createAuditLog({
      actorUserId: user.id,
      action: "VERIFY_OTP_LOGIN",
      entityType: "User",
      entityId: user.id,
      description: `User ${user.email} berhasil login dengan OTP`,
    });

    return {
      user: serializeUser(user),
      tokens,
    };
  },

  async refreshAccessToken(input: {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const refreshTokenHash = hashToken(input.refreshToken);
    const storedToken = await authModel.findRefreshTokenByHash(refreshTokenHash);

    if (!storedToken || storedToken.revokedAt) {
      throw new AppError("Refresh token tidak valid", 401);
    }

    if (storedToken.expiresAt.getTime() < Date.now()) {
      await authModel.revokeRefreshToken(storedToken.id);
      throw new AppError("Refresh token sudah kedaluwarsa", 401);
    }

    if (storedToken.user.status !== "active") {
      throw new AppError("Akun nonaktif", 403);
    }

    await authModel.revokeRefreshToken(storedToken.id);

    const tokens = await createLoginSession({
      userId: storedToken.user.id,
      role: storedToken.user.role,
      branchId: storedToken.user.branchId ?? null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return {
      user: serializeUser(storedToken.user),
      tokens,
    };
  },

  async logout(input: { refreshToken: string }) {
    const refreshTokenHash = hashToken(input.refreshToken);
    const storedToken = await authModel.findRefreshTokenByHash(refreshTokenHash);

    if (storedToken && !storedToken.revokedAt) {
      await authModel.revokeRefreshToken(storedToken.id);
    }

    return {
      loggedOut: true,
    };
  },

  async getCurrentUser(userId: string) {
    const user = await authModel.findUserById(userId);

    if (!user) {
      throw new AppError("User tidak ditemukan", 404);
    }

    return serializeUser(user);
  },
};
