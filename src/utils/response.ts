import { type Response } from "express";

interface SendSuccessOptions<T> {
  status?: number;
  message?: string;
  data?: T;
}

export function sendSuccess<T>(res: Response, options: SendSuccessOptions<T>) {
  return res.status(options.status ?? 200).json({
    success: true,
    message: options.message,
    data: options.data,
  });
}
