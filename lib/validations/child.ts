import { z } from "zod";
import { safeNameString } from "@/lib/validations/safe-name";

export const childStatusSchema = z.enum(["ACTIF", "INACTIF", "ARCHIVE"]);

export const guardianRelationSchema = z.enum(["MERE", "PERE", "TUTEUR", "AUTRE"]);

export const childFormSchema = z.object({
  first_name: safeNameString("Le prénom"),
  last_name: safeNameString("Le nom"),
  birth_date: z.string().min(1, "La date de naissance est obligatoire"),
  school_name: z.string().optional(),
  school_class: z.string().optional(),
  allergies: z.string().optional(),
  medical_notes: z.string().optional(),
  image_rights: z.coerce.boolean(),
  image_rights_date: z.string().optional(),
  outing_authorization: z.coerce.boolean(),
  outing_auth_date: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
  status: childStatusSchema.default("ACTIF"),
  guardian_relation: guardianRelationSchema,
  guardian_first_name: safeNameString("Le prénom du parent/tuteur"),
  guardian_last_name: safeNameString("Le nom du parent/tuteur"),
  guardian_email: z
    .string()
    .email("E-mail du parent invalide")
    .optional()
    .or(z.literal("")),
  guardian_phone: z.string().min(1, "Le téléphone du parent est obligatoire"),
  guardian_can_pickup: z.coerce.boolean().default(true),
});

export type ChildFormData = z.infer<typeof childFormSchema>;

export const CHILD_STATUS_LABELS: Record<
  z.infer<typeof childStatusSchema>,
  string
> = {
  ACTIF: "Actif",
  INACTIF: "Inactif",
  ARCHIVE: "Archivé",
};

export const GUARDIAN_RELATION_LABELS: Record<
  z.infer<typeof guardianRelationSchema>,
  string
> = {
  MERE: "Mère",
  PERE: "Père",
  TUTEUR: "Tuteur/trice",
  AUTRE: "Autre",
};
