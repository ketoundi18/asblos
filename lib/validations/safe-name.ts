import { z } from "zod";

/** Caractères interdits en début de nom (injection formule CSV / Excel). */
export const FORMULA_PREFIX = /^[=+\-@]/;

export function safeNameString(label: string, max = 120) {
  return z
    .string()
    .trim()
    .min(1, `${label} est obligatoire`)
    .max(max, `${label} est trop long (${max} caractères max)`)
    .refine((value) => !FORMULA_PREFIX.test(value), {
      message: `${label} ne peut pas commencer par =, +, - ou @`,
    });
}
