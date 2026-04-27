import { type RequestHandler } from "express";
import { type UserRole } from "@prisma/client";

import { AppError } from "../utils/http-error";

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.authUser) {
      next(new AppError("Akses ditolak", 401));
      return;
    }

    if (!roles.includes(req.authUser.role)) {
      next(new AppError("Anda tidak memiliki izin untuk aksi ini", 403));
      return;
    }

    next();
  };
}
