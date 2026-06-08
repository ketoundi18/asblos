import {
  validateParentLinkAction,
  rejectParentLinkAction,
} from "@/lib/actions/parent-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminParentLink } from "@/lib/data/parent-admin";
import { CheckCircle2, XCircle } from "lucide-react";

type ParentLinksPanelProps = {
  links: AdminParentLink[];
  /** Afficher uniquement les demandes en attente */
  pendingOnly?: boolean;
  /** Afficher uniquement les familles déjà validées */
  validatedOnly?: boolean;
};

export function ParentLinksPanel({
  links,
  pendingOnly = false,
  validatedOnly = false,
}: ParentLinksPanelProps) {
  const pending = links.filter((l) => !l.verified);
  const validated = links.filter((l) => l.verified);

  const showPending = !validatedOnly && pending.length > 0;
  const showValidated = !pendingOnly && validated.length > 0;

  if (links.length === 0) {
    if (pendingOnly) {
      return (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p>Aucune famille en attente pour l&apos;instant.</p>
          </CardContent>
        </Card>
      );
    }
    if (validatedOnly) return null;
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <p>Aucune demande de lien parent pour l&apos;instant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showPending ? (
        <section className="space-y-3">
          {!pendingOnly ? (
            <h3 className="text-sm font-semibold text-amber-800">
              Familles à accueillir ({pending.length})
            </h3>
          ) : null}
          {pending.map((link) => (
            <LinkCard key={link.link_id} link={link} showActions />
          ))}
        </section>
      ) : null}

      {showValidated ? (
        <section className="space-y-3">
          {!validatedOnly ? (
            <h3 className="text-sm font-semibold text-muted-foreground">
              Validées ({validated.length})
            </h3>
          ) : null}
          {validated.map((link) => (
            <LinkCard key={link.link_id} link={link} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function enrollmentStatusLabel(link: AdminParentLink) {
  if (link.membership_status === "AWAITING_PAYMENT" && (link.membership_fee_cents ?? 0) > 0) {
    return { label: "Paiement en attente", variant: "warning" as const };
  }
  if (link.membership_status === "AWAITING_ASBL") {
    return { label: "Payé · à valider", variant: "success" as const };
  }
  if (link.child_enrollment_status === "EN_ATTENTE_PAIEMENT") {
    return { label: "Paiement en attente", variant: "warning" as const };
  }
  if (link.child_enrollment_status === "PAYE_EN_ATTENTE_ASBL") {
    return { label: "Payé · à valider", variant: "success" as const };
  }
  return null;
}

function LinkCard({
  link,
  showActions = false,
}: {
  link: AdminParentLink;
  showActions?: boolean;
}) {
  const validate = validateParentLinkAction.bind(null, link.link_id);
  const reject = rejectParentLinkAction.bind(null, link.link_id);
  const paymentBlocked =
    (link.membership_status === "AWAITING_PAYMENT" &&
      (link.membership_fee_cents ?? 0) > 0) ||
    (link.child_created_via === "PARENT" &&
      link.child_enrollment_status === "EN_ATTENTE_PAIEMENT");
  const statusInfo = enrollmentStatusLabel(link);

  return (
    <Card className={showActions ? "border-amber-200" : ""}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{link.parent_name}</p>
            <p className="text-sm text-muted-foreground">{link.parent_email}</p>
            {link.parent_phone ? (
              <p className="text-sm text-muted-foreground">{link.parent_phone}</p>
            ) : null}
          </div>
          <Badge variant={link.verified ? "success" : "warning"}>
            {link.verified ? "Validé" : "En attente"}
          </Badge>
        </div>
        <p className="text-sm">
          Enfant :{" "}
          <span className="font-medium">
            {link.child_first_name} {link.child_last_name}
          </span>
          {link.child_created_via === "PARENT" ? (
            <Badge variant="warning" className="ml-2">
              Inscription en ligne
            </Badge>
          ) : null}
          {statusInfo ? (
            <Badge variant={statusInfo.variant} className="ml-2">
              {statusInfo.label}
            </Badge>
          ) : null}
        </p>
        {showActions ? (
          <div className="grid grid-cols-2 gap-2">
            {paymentBlocked ? (
              <p className="col-span-2 text-xs text-amber-700">
                En attente du paiement du parent — sans pression.
              </p>
            ) : null}
            <form action={validate}>
              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={paymentBlocked}
              >
                <CheckCircle2 className="h-4 w-4" />
                Valider
              </Button>
            </form>
            <form action={reject}>
              <Button type="submit" variant="outline" className="w-full" size="sm">
                <XCircle className="h-4 w-4" />
                Refuser
              </Button>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
