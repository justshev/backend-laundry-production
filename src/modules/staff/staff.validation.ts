import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  password: z.string().min(6),
  role: z.enum(["staff_pos"]).default("staff_pos"),
  branchId: z.string().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(6).optional(),
  password: z.string().min(6).optional(),
  branchId: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const staffParamsSchema = z.object({
  id: z.string().min(1),
});
