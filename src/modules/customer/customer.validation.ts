import { z } from "zod";

export const customerQuerySchema = z.object({
  search: z.string().trim().optional(),
});

export const customerParamsSchema = z.object({
  id: z.string().min(1),
});

//cd
