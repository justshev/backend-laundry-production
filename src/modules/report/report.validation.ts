import { z } from "zod";

export const reportFiltersSchema = z.object({
  branchId: z.string().trim().optional(),
  exactDate: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});
