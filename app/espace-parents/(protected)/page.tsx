import Link from "next/link";
import { Plus, CreditCard } from "lucide-react";
import { getParentDashboard } from "@/lib/data/parent";
import {
  getMembershipsForParentDashboard,
  membershipToParentDisplay,
} from "@/lib/data/memberships";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ParentChildLink } from "@/lib/data/parent";

function enrollmentBadge(
  link: ParentChildLink,
  membershipStatus: ReturnType<typeof membershipToParentDisplay>
) {
  if (membershipStatus.label !== "—") {
    return membershipStatus;
  }

  if (link.created_via === "PARENT") {
    if (link.enrollment_status === "EN_ATTENTE_PAIEMENT") {
      return { label: "En attente de paiement", variant: "warning" as const };
    }
    if (link.enrollment_status === "PAYE_EN_ATTENTE_ASBL") {
      return { label: "En attente ASBL", variant: "warning" as const };
    }
    if (link.enrollment_status === "VALIDE" && link.verified) {
      return { label: "Inscrit", variant: "success" as const };
    }
    if (link.enrollment_status === "REFUSE") {
      return { label: "Refusé", variant: "muted" as const };
    }
  }

  if (link.verified) {
    return { label: "Validé", variant: "success" as const };
  }
  return { label: "En attente ASBL", variant: "warning" as const };
}

export default async function EspaceParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { links, loadError } = await getParentDashboard();
  const membershipMap = await getMembershipsForParentDashboard();
  const { success } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes enfants</h1>
          <p className="text-muted-foreground">
            Inscriptions et suivi pour ta famille
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/espace-parents/inscrire">
            <Plus className="h-4 w-4" />
            Inscrire
          </Link>
        </Button>
      </div>

      {success === "inscription" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Fiche envoyée. L&apos;ASBL va valider l&apos;inscription sous peu.
        </div>
      ) : null}

      {success === "paiement" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Paiement enregistré. L&apos;ASBL va valider l&apos;inscription sous peu.
        </div>
      ) : null}

      {success === "deja-paye" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Le paiement est déjà enregistré pour cet enfant.
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      {links.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="font-medium">Aucun enfant inscrit pour l&apos;instant</p>
            <p className="text-sm text-muted-foreground">
              Clique sur Inscrire pour remplir la fiche de ton enfant.
            </p>
            <Button asChild>
              <Link href="/espace-parents/inscrire">
                <Plus className="h-4 w-4" />
                Inscrire un enfant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((child) => {
            const membership = membershipMap.get(child.child_id);
            const membershipDisplay = membershipToParentDisplay(membership ?? null);
            const badge = enrollmentBadge(child, membershipDisplay);
            const needsPayment = membershipDisplay.needsPayment;

            return (
              <Card
                key={child.link_id}
                className={badge.variant === "warning" ? "border-amber-200" : ""}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">
                      {child.first_name} {child.last_name}
                    </p>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  {needsPayment ? (
                    <Button asChild className="w-full" size="sm">
                      <Link href={`/espace-parents/paiement/${child.child_id}`}>
                        <CreditCard className="h-4 w-4" />
                        Finaliser le paiement
                      </Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
