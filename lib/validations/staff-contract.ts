import { z } from "zod";

const workDaySchema = z.coerce.number().int().min(1).max(7);

export const upsertStaffContractSchema = z
  .object({
    member_id: z.string().uuid("Membre invalide"),
    hours: z.coerce.number().int().min(0, "Heures invalides").max(23, "Max 23 h"),
    minutes: z.coerce.number().int().min(0, "Minutes invalides").max(59, "Max 59 min"),
    work_days: z
      .array(workDaySchema)
      .min(1, "Choisis au moins un jour travaillé")
      .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
  })
  .refine((d) => d.hours * 60 + d.minutes > 0, {
    message: "L'objectif doit être supérieur à 0",
    path: ["hours"],
  });

export type UpsertStaffContractInput = z.infer<typeof upsertStaffContractSchema>;
