import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  hours: z.string().trim().min(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateBranchSchema = createBranchSchema.partial();

export const branchParamsSchema = z.object({
  id: z.string().min(1),
});
