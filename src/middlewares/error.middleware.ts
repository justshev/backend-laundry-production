import { Prisma } from "@prisma/client";
import { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env";
import { AppError } from "../utils/http-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: "Validasi data gagal",
      errors: error.issues,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Data duplikat terdeteksi",
        code: error.code,
      });
      return;
    }

    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Data tidak ditemukan",
        code: error.code,
      });
      return;
    }
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Terjadi kesalahan internal";

  res.status(500).json({
    success: false,
    message,
    ...(env.NODE_ENV !== "production" && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });
};
