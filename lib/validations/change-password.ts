import { z } from "zod";

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Indique ton mot de passe actuel"),
    new_password: z.string().min(8, "Minimum 8 caractères"),
    new_password_confirm: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: "Les nouveaux mots de passe ne correspondent pas",
    path: ["new_password_confirm"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "Le nouveau mot de passe doit être différent de l'actuel",
    path: ["new_password"],
  });
