/** Communication structurée pour virement bancaire (unique par paiement). */

const REF_PREFIX = "ASBL";

export type TransferReferencePurpose = "MEMBERSHIP" | "ACTIVITY";

export function buildTransferReference(params: {
  schoolYear: string;
  childId: string;
  purpose: TransferReferencePurpose;
  paymentId: string;
}): string {
  const yearDigits = params.schoolYear.replace(/\D/g, "");
  const yearShort = yearDigits.length >= 2 ? yearDigits.slice(-2) : "00";
  const purposeCode = params.purpose === "ACTIVITY" ? "ACT" : "COT";
  const childShort = params.childId.replace(/-/g, "").slice(0, 4).toUpperCase();
  const payShort = params.paymentId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${REF_PREFIX}-${yearShort}-${purposeCode}-${childShort}-${payShort}`;
}

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function formatIbanForDisplay(iban: string): string {
  const normalized = normalizeIban(iban);
  return normalized.replace(/(.{4})/g, "$1 ").trim();
}

export function isValidIbanFormat(iban: string): boolean {
  const normalized = normalizeIban(iban);
  if (normalized.length < 15 || normalized.length > 34) return false;
  return /^[A-Z]{2}[0-9A-Z]+$/.test(normalized);
}

export function isValidTransferReference(raw: string): boolean {
  const normalized = raw.trim();
  if (normalized.length < 3 || normalized.length > 40) return false;
  return /^[A-Za-z0-9\s\-]+$/.test(normalized);
}

/**
 * Communication unique par enfant pour une activité payante.
 * Base = communication ASBL sur l'activité ; suffixe = enfant + paiement (index UNIQUE en base).
 */
export function buildActivityPaymentTransferReference(params: {
  activityReference: string;
  childId: string;
  paymentId: string;
}): string {
  const base = params.activityReference.trim().toUpperCase().replace(/\s+/g, "");
  const childShort = params.childId.replace(/-/g, "").slice(0, 4).toUpperCase();
  const payShort = params.paymentId.replace(/-/g, "").slice(0, 4).toUpperCase();
  const suffix = `-${childShort}-${payShort}`;
  const maxBaseLen = Math.max(3, 40 - suffix.length);
  const baseTrimmed = base.slice(0, maxBaseLen).replace(/-+$/, "");
  const combined = `${baseTrimmed}${suffix}`;
  return combined.slice(0, 40);
}

/** Suggestion de communication pour une activité payante. */
export function suggestActivityTransferReference(
  title: string,
  activityDate?: string
): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18)
    .toUpperCase();

  let datePart = "";
  if (activityDate && /^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
    datePart = activityDate.slice(2, 4) + activityDate.slice(5, 7);
  } else {
    datePart = new Date().getFullYear().toString().slice(-2);
  }

  return slug ? `ASBL-ACT-${slug}-${datePart}` : `ASBL-ACT-${datePart}`;
}
