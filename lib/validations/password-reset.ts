import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'e-mail est obligatoire")
    .email("Adresse e-mail invalide")
    .transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Minimum 8 caractères"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirm"],
  });

export type PasswordResetChannel = "staff" | "parent";
