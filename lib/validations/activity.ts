import { z } from "zod";

export const activityStatusSchema = z.enum([
  "PLANIFIEE",
  "EN_COURS",
  "TERMINEE",
  "ANNULEE",
]);

import { isEndTimeAfterStart } from "@/lib/date-utils";

export const activityFormSchema = z
  .object({
    title: z.string().min(1, "Le titre est obligatoire"),
    description: z.string().optional(),
    activity_date: z.string().min(1, "La date est obligatoire"),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    location: z.string().optional(),
    max_participants: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() !== "" ? Number(v) : undefined))
      .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
        message: "Le nombre de places doit être un entier positif",
      }),
    status: activityStatusSchema.default("PLANIFIEE"),
    is_paid: z.coerce.boolean().default(false),
    price_euros: z.string().optional(),
    parent_registration_open: z.coerce.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.is_paid) {
      const raw = data.price_euros?.trim().replace(",", ".") ?? "";
      const amount = Number(raw);
      if (!raw || Number.isNaN(amount) || amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indique un prix en euros (ex. 15 ou 15,50)",
          path: ["price_euros"],
        });
      }
    }

    if (
      data.start_time?.trim() &&
      data.end_time?.trim() &&
      !isEndTimeAfterStart(data.start_time, data.end_time)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'heure de fin doit être après l'heure de début",
        path: ["end_time"],
      });
    }
  });

export type ActivityFormData = z.infer<typeof activityFormSchema>;

export const ACTIVITY_STATUS_LABELS: Record<
  z.infer<typeof activityStatusSchema>,
  string
> = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};
