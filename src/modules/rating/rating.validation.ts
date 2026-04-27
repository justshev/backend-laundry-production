import { z } from "zod";

export const ratingQuerySchema = z.object({
  branchId: z.string().trim().optional(),
});
