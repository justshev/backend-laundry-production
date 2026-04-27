import { z } from "zod";

const serviceBaseSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  price: z.coerce.number().int().positive(),
  unit: z.string().trim().min(1),
  durationLabel: z.string().trim().min(1).optional(),
  duration: z.string().trim().min(1).optional(),
  estimatedDurationHours: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  availableBranchIds: z.array(z.string().min(1)).min(1),
});

export const createServiceSchema = serviceBaseSchema.refine(
  (value) => value.durationLabel || value.duration,
  {
    path: ["durationLabel"],
    message: "Durasi layanan wajib diisi",
  },
);

export const updateServiceSchema = serviceBaseSchema.partial();

export const serviceParamsSchema = z.object({
  id: z.string().min(1),
});
