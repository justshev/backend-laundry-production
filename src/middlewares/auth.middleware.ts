import { type RequestHandler } from "express";

import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "../utils/token";
import { AppError } from "../utils/http-error";
import { serializeUser } from "../utils/user";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError("Akses ditolak", 401);
    }

    const token = authorization.slice(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { branch: true },
    });

    if (!user || user.status !== "active") {
      throw new AppError("Sesi tidak valid", 401);
    }

    req.authUser = serializeUser(user);
    next();
  } catch (error) {
    next(error);
  }
};
