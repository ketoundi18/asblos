import type { AsblSettingsSnapshot } from "@/lib/asbl/fee-utils";
import type { Activity } from "@/types/activity";

export type ResolvedBankDetails = {
  iban: string;
  accountHolder: string;
  transferReference: string | null;
  instructions: string | null;
};

/** Cotisation enfant — compte ASBL (Administration). */
export function resolveMembershipBankDetails(
  settings: AsblSettingsSnapshot | null
): ResolvedBankDetails | null {
  const iban = settings?.bank_iban?.trim();
  if (!iban) return null;

  return {
    iban,
    accountHolder: settings?.bank_account_holder?.trim() || "ASBL",
    transferReference: null,
    instructions: settings?.bank_transfer_instructions ?? null,
  };
}

/** Activité payante — compte de l'activité, sinon compte ASBL par défaut. */
export function resolveActivityBankDetails(
  activity: Pick<
    Activity,
    | "payment_bank_iban"
    | "payment_bank_account_holder"
    | "payment_transfer_reference"
  >,
  settings: AsblSettingsSnapshot | null
): ResolvedBankDetails | null {
  const iban =
    activity.payment_bank_iban?.trim() || settings?.bank_iban?.trim() || "";
  if (!iban) return null;

  return {
    iban,
    accountHolder:
      activity.payment_bank_account_holder?.trim() ||
      settings?.bank_account_holder?.trim() ||
      "ASBL",
    transferReference: activity.payment_transfer_reference?.trim() || null,
    instructions: settings?.bank_transfer_instructions ?? null,
  };
}

export function hasMembershipBankConfig(settings: AsblSettingsSnapshot | null): boolean {
  return !!settings?.bank_iban?.trim();
}

export function hasActivityBankConfig(
  activity: Pick<Activity, "price_cents" | "payment_bank_iban">,
  settings: AsblSettingsSnapshot | null
): boolean {
  if ((activity.price_cents ?? 0) <= 0) return true;
  return !!(activity.payment_bank_iban?.trim() || settings?.bank_iban?.trim());
}
