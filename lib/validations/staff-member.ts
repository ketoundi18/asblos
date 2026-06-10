import { z } from "zod";

/** Caractères interdits en début de nom (injection formule CSV / Excel). */
const FORMULA_PREFIX = /^[=+\-@]/;

export const creatableStaffRoleSchema = z.enum([
  "TRAVAILLEUR",
  "STAGIAIRE",
  "BENEVOLE",
]);

export const createStaffMemberSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Le nom est obligatoire")
      .max(120, "Le nom est trop long (120 caractères max)")
      .refine((value) => !FORMULA_PREFIX.test(value), {
        message: "Le nom ne peut pas commencer par =, +, - ou @",
      }),
    email: z.string().email("E-mail invalide"),
    role: creatableStaffRoleSchema,
    password: z.string().min(8, "Minimum 8 caractères"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirm"],
  });

export type CreatableStaffRole = z.infer<typeof creatableStaffRoleSchema>;
