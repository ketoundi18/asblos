"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmSchoolSupportMembershipAction } from "@/lib/actions/school-support-admin";
import type { SchoolSupportAdminRequest } from "@/lib/data/school-support-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CalendarDays, ExternalLink, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "confirm" | "payment";

type Props = {
  requests: SchoolSupportAdminRequest[];
  embedded?: boolean;
  returnTo?: string;
  showDetails?: boolean;
  canConfirmActions?: boolean;
};

export function SchoolSupportAdminPanel({
  requests,
  embedded = false,
  returnTo = "/soutien-scolaire/demandes",
  showDetails = false,
  canConfirmActions = true,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as Filter) || "all";

  const toConfirm = requests.filter((r) => r.can_confirm);
  const waitingPayment = requests.filter((r) => !r.can_confirm);

  const visible =
    filter === "confirm"
      ? toConfirm
      : filter === "payment"
        ? waitingPayment
        : requests;

  function setFilter(next: Filter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    const query = params.toString();
    router.replace(query ? `${returnTo}?${query}` : returnTo, { scroll: false });
  }

  return (
    <div className="space-y-4">
      {!embedded ? (
        <div>
          <h2 className="text-lg font-semibold">Demandes en cours</h2>
          <p className="text-sm text-muted-foreground">
            Parents inscrits à la formule soutien scolaire — à confirmer ou en attente de
            paiement.
          </p>
        </div>
      ) : null}

      {!embedded ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={filter === "all"}
            label={`Toutes (${requests.length})`}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            active={filter === "confirm"}
            label={`À confirmer (${toConfirm.length})`}
            onClick={() => setFilter("confirm")}
          />
          <FilterChip
            active={filter === "payment"}
            label={`Paiement (${waitingPayment.length})`}
            onClick={() => setFilter("payment")}
          />
        </div>
      ) : null}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <p>Aucune demande de soutien scolaire en attente.</p>
            <p className="mt-2 text-xs">
              Quand un parent choisit la formule soutien scolaire, la demande apparaît
              ici automatiquement.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {embedded ? (
        <>
          {toConfirm.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                À confirmer ({toConfirm.length})
              </h3>
              {toConfirm.map((req) => (
                <RequestCard
                  key={req.membership_id}
                  request={req}
                  showConfirm={canConfirmActions}
                  returnTo={returnTo}
                  showDetails={showDetails}
                  canConfirmActions={canConfirmActions}
                />
              ))}
            </section>
          ) : null}
          {waitingPayment.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                En attente de paiement ({waitingPayment.length})
              </h3>
              {waitingPayment.map((req) => (
                <RequestCard
                  key={req.membership_id}
                  request={req}
                  returnTo={returnTo}
                  showDetails={showDetails}
                  canConfirmActions={canConfirmActions}
                />
              ))}
            </section>
          ) : null}
        </>
      ) : (
        <section className="space-y-3">
          {visible.map((req) => (
            <RequestCard
              key={req.membership_id}
              request={req}
              showConfirm={req.can_confirm && canConfirmActions}
              returnTo={returnTo}
              showDetails={showDetails}
              canConfirmActions={canConfirmActions}
            />
          ))}
          {visible.length === 0 && requests.length > 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Aucune demande dans cette catégorie.
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </button>
  );
}

function RequestCard({
  request,
  showConfirm = false,
  returnTo,
  showDetails = false,
  canConfirmActions = true,
}: {
  request: SchoolSupportAdminRequest;
  showConfirm?: boolean;
  returnTo: string;
  showDetails?: boolean;
  canConfirmActions?: boolean;
}) {
  const confirm = confirmSchoolSupportMembershipAction.bind(null, request.child_id);

  return (
    <Card className={showConfirm ? "border-amber-200 bg-amber-50/30" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{request.child_name}</CardTitle>
            {showDetails ? (
              <Link
                href={`/enfants/${request.child_id}`}
                className="inline-flex items-center text-xs text-primary hover:underline"
              >
                Voir la fiche enfant
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            ) : null}
          </div>
          <Badge variant={showConfirm ? "warning" : "muted"}>{request.status_label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {request.parent_name}
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {request.parent_email}
          </span>
        </div>

        <p className="text-muted-foreground">
          Cotisation : <strong className="text-foreground">{request.fee_label}</strong>
        </p>

        {showDetails ? (
          <div className="rounded-lg border bg-background/60 p-3 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Programme &amp; jours
            </p>
            {request.program_title ? (
              <p>{request.program_title}</p>
            ) : (
              <p className="text-muted-foreground">Programme — pas encore choisi</p>
            )}
            {request.slot_labels.length > 0 ? (
              <ul className="space-y-1">
                {request.slot_labels.map((label) => (
                  <li key={label} className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Jours souhaités — pas encore indiqués (le parent peut le faire plus tard).
              </p>
            )}
            {request.enrollment_status === "PENDING" ? (
              <p className="text-xs text-amber-800">
                Inscription programme en attente — sera activée à la confirmation ASBL.
              </p>
            ) : null}
          </div>
        ) : null}

        {showConfirm ? (
          <form action={confirm} className="flex flex-wrap gap-2">
            <input type="hidden" name="return_to" value={returnTo} />
            <Button type="submit" size="sm">
              <CheckCircle2 className="h-4 w-4" />
              Confirmer le soutien scolaire
            </Button>
          </form>
        ) : request.can_confirm && !canConfirmActions ? (
          <p className="text-xs text-muted-foreground">
            Seul un administrateur peut confirmer cette demande.
          </p>
        ) : !request.can_confirm ? (
          <p className="text-xs text-amber-800">
            Le parent doit d&apos;abord régler la cotisation (ou simuler le paiement en
            test).
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
