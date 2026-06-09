import type { AdminParentLink } from "@/lib/data/parent-admin";
import type { SchoolSupportAdminRequest } from "@/lib/data/school-support-admin";
import {
  isReadyToValidate,
  isWaitingPayment,
  linksToItems,
} from "@/lib/data/command-center/parent-link-rules";
import type { CommandSection } from "@/lib/data/command-center/types";

export function buildAdminCommandSections(
  links: AdminParentLink[],
  schoolSupportRequests: SchoolSupportAdminRequest[]
): CommandSection[] {
  const sections: CommandSection[] = [];
  const soutienToConfirm = schoolSupportRequests.filter((r) => r.can_confirm);
  const soutienChildIds = new Set(soutienToConfirm.map((r) => r.child_id));

  const readyLinks = links.filter(
    (l) => isReadyToValidate(l) && !soutienChildIds.has(l.child_id)
  );
  if (readyLinks.length > 0) {
    sections.push({
      id: "validate",
      title: "Familles à accueillir",
      description: "Ces parents sont prêts — validez en un clic",
      items: readyLinks.map((l) => ({
        id: l.link_id,
        title: `${l.child_first_name} ${l.child_last_name}`,
        subtitle: `${l.parent_name} · ${l.parent_email}`,
        href: "/administration",
        priority: "urgent" as const,
        actionLabel: "Valider",
        quickAction: "validate_parent" as const,
        quickActionId: l.link_id,
      })),
      priority: "urgent",
    });
  }

  const paymentWaitItems = linksToItems(
    links,
    isWaitingPayment,
    "attention",
    (l) => `Cotisation en attente · ${l.parent_name}`
  );
  if (paymentWaitItems.length > 0) {
    sections.push({
      id: "waiting-payment",
      title: "Cotisations en attente",
      description: "Ces familles n'ont pas encore payé — sans pression",
      items: paymentWaitItems,
      priority: "attention",
    });
  }

  if (soutienToConfirm.length > 0) {
    sections.push({
      id: "school-support",
      title: "Accompagnement scolaire à confirmer",
      description: "Ces parents ont activé le soutien scolaire — confirmez en un clic",
      items: soutienToConfirm.map((r) => ({
        id: r.membership_id,
        title: r.child_name,
        subtitle: `${r.parent_name} · ${r.fee_label}`,
        href: "/soutien-scolaire/demandes?filter=confirm",
        priority: "urgent" as const,
        actionLabel: "Confirmer",
        quickAction: "confirm_school_support" as const,
        quickActionId: r.child_id,
      })),
      priority: "urgent",
    });
  }

  const soutienPayment = schoolSupportRequests.filter((r) => !r.can_confirm);
  if (soutienPayment.length > 0) {
    sections.push({
      id: "school-support-payment",
      title: "Soutien scolaire — paiement en attente",
      description: "Le parent doit encore régler la cotisation",
      items: soutienPayment.map((r) => ({
        id: r.membership_id,
        title: r.child_name,
        subtitle: `${r.parent_name} · ${r.fee_label}`,
        href: "/soutien-scolaire/demandes?filter=payment",
        priority: "attention" as const,
        actionLabel: "Voir",
      })),
      priority: "attention",
    });
  }

  return sections;
}
