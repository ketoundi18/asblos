import type { AuditAction } from "@/lib/audit/log-audit";

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CHILD_CREATED: "Fiche enfant créée",
  CHILD_VALIDATED: "Inscription validée",
  CHILD_REJECTED: "Inscription refusée",
  CHILD_ANONYMIZED: "Fiche anonymisée",
  PARENT_LINK_VERIFIED: "Lien parent vérifié",
  PAYMENT_PAID: "Paiement confirmé",
  PAYMENT_FAILED: "Paiement échoué",
  MEMBERSHIP_ACTIVATED: "Adhésion activée",
  ASBL_SETTINGS_UPDATED: "Tarif ASBL modifié",
  STAFF_CLOCK_IN: "Service commencé",
  STAFF_CLOCK_OUT: "Service terminé",
  STAFF_TIME_SETTLEMENT: "Clôture journalière solde",
  STAFF_TIME_ADJUSTMENT: "Pointage corrigé (admin)",
  STAFF_ACCOUNT_CREATED: "Compte équipe créé",
  STAFF_ACCOUNT_ACTIVATED: "Compte équipe réactivé",
  STAFF_ACCOUNT_DEACTIVATED: "Compte équipe désactivé",
  STAFF_CONTRACT_CREATED: "Objectif horaire défini",
  STAFF_CONTRACT_UPDATED: "Objectif horaire modifié",
  PASSWORD_CHANGED: "Mot de passe modifié",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  children: "Enfant",
  payments: "Paiement",
  memberships: "Adhésion",
  profiles: "Profil",
  parent_child_links: "Lien parent",
  asbl_settings: "Réglages ASBL",
  staff_time_entries: "Pointage staff",
  staff_time_ledger: "Solde flexibilité",
};

export const AUDIT_ACTION_OPTIONS: { value: AuditAction; label: string }[] = (
  Object.entries(AUDIT_ACTION_LABELS) as [AuditAction, string][]
).map(([value, label]) => ({ value, label }));

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function getAuditEntityLabel(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType] ?? entityType;
}

export function formatAuditDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-BE", {
    timeZone: "Europe/Brussels",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function getAuditEntityHref(
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>
): string | null {
  if (entityType === "children") {
    return `/enfants/${entityId}`;
  }
  if (entityType === "payments") {
    return "/paiements";
  }
  if (entityType === "asbl_settings") {
    return "/administration";
  }
  if (entityType === "parent_child_links") {
    const childId = metadata.child_id;
    if (typeof childId === "string") return `/enfants/${childId}`;
    return "/administration";
  }
  if (entityType === "memberships") {
    const childId = metadata.child_id;
    if (typeof childId === "string") return `/enfants/${childId}`;
    return null;
  }
  return null;
}

export function summarizeAuditMetadata(
  action: string,
  metadata: Record<string, unknown>
): string | null {
  if (action === "ASBL_SETTINGS_UPDATED") {
    const prev = metadata.previous_fee_cents;
    const next = metadata.new_fee_cents;
    if (typeof prev === "number" && typeof next === "number") {
      return `Tarif : ${(prev / 100).toFixed(2)} € → ${(next / 100).toFixed(2)} €`;
    }
  }
  if (action === "PAYMENT_PAID" || action === "PAYMENT_FAILED") {
    const source = metadata.source;
    if (typeof source === "string" && source === "mollie_webhook") {
      return "Via Mollie";
    }
    if (typeof source === "string" && source === "mark_membership_paid_admin") {
      return "Marqué manuellement (staff)";
    }
  }
  if (action === "CHILD_VALIDATED" || action === "CHILD_REJECTED") {
    return "Espace parents";
  }
  return null;
}

export function getAuditActionBadgeVariant(
  action: string
): "default" | "success" | "warning" | "muted" {
  if (action === "PAYMENT_FAILED" || action === "CHILD_REJECTED") {
    return "warning";
  }
  if (
    action === "PAYMENT_PAID" ||
    action === "CHILD_VALIDATED" ||
    action === "MEMBERSHIP_ACTIVATED"
  ) {
    return "success";
  }
  return "muted";
}
