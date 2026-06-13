import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canRecordPayment } from "@/lib/auth/permissions";
import { getStaffPayments } from "@/lib/data/payments-staff";
import { StaffPaymentProofCard } from "@/components/staff/staff-payment-proof-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCentsForDisplay } from "@/lib/config/payments";
import { resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";

function statusBadge(status: string) {
  if (status === "PAID") return { label: "Payé", variant: "success" as const };
  if (status === "PROOF_SUBMITTED") return { label: "Preuve à valider", variant: "warning" as const };
  if (status === "PENDING") return { label: "En attente", variant: "muted" as const };
  if (status === "FAILED") return { label: "Échoué", variant: "muted" as const };
  return { label: status, variant: "muted" as const };
}

function methodLabel(method: string | null, purpose: string | null) {
  if (purpose === "ACTIVITY") return "Activité · virement";
  if (method === "BANCONTACT") return "Bancontact";
  if (method === "CARD") return "Carte";
  if (method === "OTHER") return "Virement";
  return "—";
}

export default async function PaiementsPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canRecordPayment(profile.role)) {
    redirect("/");
  }

  const { payments, proofQueue, loadError } = await getStaffPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paiements</h1>
        <p className="text-muted-foreground">
          Preuves de virement et historique des cotisations
        </p>
      </div>

      {loadError ? (
        <ServerNoticeToast flash={resolveLoadErrorToast(loadError, "staff")} />
      ) : null}

      {proofQueue.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Preuves à valider ({proofQueue.length})
          </h2>
          {proofQueue.map((p) => (
            <StaffPaymentProofCard key={p.id} payment={p} />
          ))}
        </section>
      ) : null}

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucun paiement enregistré pour l&apos;instant.
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Historique</h2>
          {payments.map((p) => {
            const badge = statusBadge(p.status);
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    {p.child_first_name} {p.child_last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {p.parent_name} · {p.parent_email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {methodLabel(p.method, p.purpose)} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("fr-BE")}
                      {p.transfer_reference ? ` · ${p.transfer_reference}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatCentsForDisplay(p.amount_cents)}
                    </span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
