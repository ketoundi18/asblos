import type { AdminParentLink } from "@/lib/data/parent-admin";
import type { CommandItem, CommandPriority } from "@/lib/data/command-center/types";

export function isReadyToValidate(link: AdminParentLink): boolean {
  if (link.verified) return false;
  if (
    link.membership_status === "AWAITING_PAYMENT" &&
    (link.membership_fee_cents ?? 0) > 0
  ) {
    return false;
  }
  if (link.child_enrollment_status === "EN_ATTENTE_PAIEMENT") {
    return false;
  }
  return true;
}

export function isWaitingPayment(link: AdminParentLink): boolean {
  if (link.verified) return false;
  if (
    link.membership_status === "AWAITING_PAYMENT" &&
    (link.membership_fee_cents ?? 0) > 0
  ) {
    return true;
  }
  return link.child_enrollment_status === "EN_ATTENTE_PAIEMENT";
}

export function linksToItems(
  links: AdminParentLink[],
  filter: (l: AdminParentLink) => boolean,
  priority: CommandPriority,
  subtitleFn: (l: AdminParentLink) => string
): CommandItem[] {
  return links.filter(filter).map((l) => ({
    id: l.link_id,
    title: `${l.child_first_name} ${l.child_last_name}`,
    subtitle: subtitleFn(l),
    href: "/administration",
    priority,
    actionLabel: "Administration",
  }));
}
