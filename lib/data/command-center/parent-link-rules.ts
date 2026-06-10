import type { AdminParentLink } from "@/lib/data/parent-admin";
import type { CommandItem, CommandPriority } from "@/lib/data/command-center/types";
import {
  adminLinkReadyToValidate,
  adminLinkWaitingPayment,
} from "@/lib/enrollment/child-enrollment-state";

function linkInput(link: AdminParentLink) {
  return {
    verified: link.verified,
    membership_status: link.membership_status,
    membership_fee_cents: link.membership_fee_cents,
    child_enrollment_status: link.child_enrollment_status,
    child_created_via: link.child_created_via,
  };
}

export function isReadyToValidate(link: AdminParentLink): boolean {
  return adminLinkReadyToValidate(linkInput(link));
}

export function isWaitingPayment(link: AdminParentLink): boolean {
  return adminLinkWaitingPayment(linkInput(link));
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
