import { createHash, randomBytes } from "node:crypto";

import { type UserRole } from "@prisma/client";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  branchId: string | null;
}

export function createAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function generateRefreshToken() {
  return randomBytes(48).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
