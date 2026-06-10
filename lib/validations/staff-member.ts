import { z } from "zod";
import { safeNameString } from "@/lib/validations/safe-name";

export const creatableStaffRoleSchema = z.enum([
  "TRAVAILLEUR",
  "STAGIAIRE",
  "BENEVOLE",
]);

export const createStaffMemberSchema = z
  .object({
    full_name: safeNameString("Le nom"),
    email: z
      .string()
      .trim()
      .email("E-mail invalide")
      .transform((value) => value.toLowerCase()),
    role: creatableStaffRoleSchema,
    password: z.string().min(8, "Minimum 8 caractères"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirm"],
  });

export type CreatableStaffRole = z.infer<typeof creatableStaffRoleSchema>;
