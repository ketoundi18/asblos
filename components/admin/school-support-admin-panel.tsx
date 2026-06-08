import { confirmSchoolSupportMembershipAction } from "@/lib/actions/school-support-admin";
import type { SchoolSupportAdminRequest } from "@/lib/data/school-support-admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function SchoolSupportAdminPanel({
  requests,
  embedded = false,
}: {
  requests: SchoolSupportAdminRequest[];
  embedded?: boolean;
}) {
  const toConfirm = requests.filter((r) => r.can_confirm);
  const waitingPayment = requests.filter((r) => !r.can_confirm);

  return (
    <div className="space-y-4">
      {!embedded ? (
        <div>
          <h2 className="text-lg font-semibold">Accompagnement scolaire — demandes</h2>
          <p className="text-sm text-muted-foreground">
            Quand un parent active le soutien scolaire, la demande apparaît ici.
          </p>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <p>Aucune demande de soutien scolaire en attente.</p>
            <p className="mt-2 text-xs">
              Demandez au parent de cliquer « Activer le soutien scolaire », puis rechargez
              cette page (Cmd+Shift+R).
            </p>
          </CardContent>
        </Card>
      ) : null}

      {toConfirm.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            À confirmer ({toConfirm.length})
          </h3>
          {toConfirm.map((req) => (
            <RequestCard key={req.membership_id} request={req} showConfirm />
          ))}
        </section>
      ) : null}

      {waitingPayment.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            En attente de paiement ({waitingPayment.length})
          </h3>
          {waitingPayment.map((req) => (
            <RequestCard key={req.membership_id} request={req} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function RequestCard({
  request,
  showConfirm = false,
}: {
  request: SchoolSupportAdminRequest;
  showConfirm?: boolean;
}) {
  const confirm = confirmSchoolSupportMembershipAction.bind(null, request.child_id);

  return (
    <Card className={showConfirm ? "border-amber-200 bg-amber-50/30" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{request.child_name}</CardTitle>
          <Badge variant={showConfirm ? "warning" : "muted"}>{request.status_label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Parent : {request.parent_name} · {request.parent_email}
        </p>
        <p className="text-muted-foreground">
          Cotisation soutien scolaire : <strong>{request.fee_label}</strong>
        </p>
        {showConfirm ? (
          <form action={confirm}>
            <Button type="submit" size="sm">
              <CheckCircle2 className="h-4 w-4" />
              Confirmer le soutien scolaire
            </Button>
          </form>
        ) : (
          <p className="text-xs text-amber-800">
            Le parent doit d&apos;abord régler la cotisation (ou simuler le paiement en test).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
