import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { syncMolliePaymentByInternalId } from "@/lib/payments/sync-mollie";
import { createClient } from "@/lib/supabase/server";

export default async function ParentPaiementRetourPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  let status: "paid" | "pending" | "failed" | "unknown" = "unknown";
  let childId: string | null = null;

  if (ref) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: ownedPayment } = await supabase
        .from("payments")
        .select("child_id, parent_id")
        .eq("id", ref)
        .maybeSingle<{ child_id: string; parent_id: string }>();

      if (ownedPayment && ownedPayment.parent_id === user.id) {
        childId = ownedPayment.child_id;

        const result = await syncMolliePaymentByInternalId(ref);
        if (result.status === "PAID") {
          status = "paid";
        } else if (result.status === "FAILED") {
          status = "failed";
        } else if (result.status === "PENDING") {
          status = "pending";
        }
      }
    }
  }

  const retryHref = childId
    ? `/espace-parents/paiement/${childId}`
    : "/espace-parents";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {status === "paid" ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-success" />
              <div>
                <p className="text-lg font-semibold">Paiement reçu</p>
                <p className="text-sm text-muted-foreground">
                  Merci ! L&apos;ASBL va valider l&apos;inscription sous peu.
                </p>
              </div>
              <Button asChild>
                <Link href="/espace-parents?success=paiement">
                  Retour — Mes enfants
                </Link>
              </Button>
            </>
          ) : status === "pending" ? (
            <>
              <Clock className="h-12 w-12 text-warning" />
              <div>
                <p className="text-lg font-semibold">Paiement en cours</p>
                <p className="text-sm text-muted-foreground">
                  Bancontact peut prendre quelques minutes. Reviens sur Mes
                  enfants dans un instant.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/espace-parents">Mes enfants</Link>
              </Button>
            </>
          ) : status === "failed" ? (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="text-lg font-semibold">Paiement non abouti</p>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez réessayer le paiement maintenant.
                </p>
              </div>
              <Button asChild>
                <Link href={retryHref}>Réessayer le paiement</Link>
              </Button>
            </>
          ) : (
            <>
              <Clock className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold">Retour du paiement</p>
                <p className="text-sm text-muted-foreground">
                  Consultez Mes enfants pour voir le statut mis à jour.
                </p>
              </div>
              <Button asChild>
                <Link href="/espace-parents">Mes enfants</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
