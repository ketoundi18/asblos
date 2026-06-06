/** Montant d'inscription enfant (centimes). Ex. 3000 = 30,00 € */
export function getEnrollmentFeeCents(): number {
  const raw = process.env.ENROLLMENT_FEE_CENTS ?? "3000";
  const cents = parseInt(raw, 10);
  if (!Number.isFinite(cents) || cents <= 0) {
    return 3000;
  }
  return cents;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export function formatCentsForMollie(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatCentsForDisplay(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Paiement simulé — dev local uniquement, sans Mollie */
export function isPaymentSimulationEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.ALLOW_PAYMENT_SIMULATION !== "false";
}
