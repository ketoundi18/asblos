import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
} from "lucide-react";
import { confirmSchoolSupportMembershipAction } from "@/lib/actions/school-support-admin";
import type { ChildOverview } from "@/lib/data/child-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  childId: string;
  overview: ChildOverview;
  showAdminActions?: boolean;
};

export function ChildOverviewPanel({ childId, overview, showAdminActions = false }: Props) {
  const confirm = confirmSchoolSupportMembershipAction.bind(null, childId);

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          Vue d&apos;ensemble
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <OverviewRow
          icon={ClipboardList}
          title="Inscription"
          badge={
            overview.membership ? (
              <Badge variant={overview.membership.variant}>
                {overview.membership.statusLabel}
              </Badge>
            ) : (
              <Badge variant="muted">Non renseignée</Badge>
            )
          }
        >
          {overview.membership ? (
            <p className="text-sm text-muted-foreground">
              {overview.membership.planLabel}
              {overview.membership.feeLabel !== "Gratuit"
                ? ` · ${overview.membership.feeLabel}/an`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune adhésion pour cette année scolaire.
            </p>
          )}
        </OverviewRow>

        <OverviewRow
          icon={BookOpen}
          title="Accompagnement scolaire"
          badge={
            overview.schoolSupport ? (
              <Badge variant="success">{overview.schoolSupport.statusLabel}</Badge>
            ) : overview.membership?.planLabel === "Inscription simple" ? (
              <Badge variant="muted">Non activé</Badge>
            ) : null
          }
        >
          {overview.schoolSupport ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              {overview.schoolSupport.programTitle ? (
                <p>{overview.schoolSupport.programTitle}</p>
              ) : null}
              {overview.schoolSupport.slotLabels.length > 0 ? (
                <ul className="list-inside list-disc">
                  {overview.schoolSupport.slotLabels.map((slot) => (
                    <li key={slot}>{slot}</li>
                  ))}
                </ul>
              ) : null}
              {showAdminActions && overview.membership?.canConfirmSchoolSupport ? (
                <form action={confirm} className="pt-2">
                  <Button type="submit" size="sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmer le soutien scolaire
                  </Button>
                </form>
              ) : null}
              {overview.schoolSupport.programId ? (
                <Link
                  href={`/soutien-scolaire/${overview.schoolSupport.programId}`}
                  className="inline-block text-xs font-medium text-primary hover:underline"
                >
                  Voir le programme →
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Pas de soutien scolaire pour l&apos;instant.</p>
          )}
        </OverviewRow>

        <OverviewRow icon={Calendar} title="Activités à venir">
          {overview.activities.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {overview.activities.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="font-medium text-foreground hover:text-primary">
                    {a.title}
                  </Link>
                  <p className="text-muted-foreground">
                    {a.dateLabel} · {a.paymentLabel}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune activité inscrite prochainement.</p>
          )}
        </OverviewRow>

        <OverviewRow icon={CreditCard} title="Paiements récents">
          {overview.payments.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {overview.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">{p.dateLabel}</span>
                  <span className="font-medium">{p.amountLabel}</span>
                  <Badge variant={p.statusLabel === "Payé" ? "success" : "warning"}>
                    {p.statusLabel}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
          )}
          <Link
            href="/paiements"
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            Tous les paiements →
          </Link>
        </OverviewRow>
      </CardContent>
    </Card>
  );
}

function OverviewRow({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}
