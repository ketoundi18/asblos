import Link from "next/link";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Ancienne page retour Mollie — redirige vers le flux virement. */
export default async function ParentPaiementRetourPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  let childId: string | null = null;
  if (ref) {
    const { createClient } = await import("@/lib/supabase/server");
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
      }
    }
  }

  const paymentHref = childId
    ? `/espace-parents/paiement/${childId}`
    : "/espace-parents";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <Landmark className="h-12 w-12 text-primary" />
          <div>
            <p className="text-lg font-semibold">Paiement par virement</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Les paiements en ligne (Bancontact / carte) ne sont plus utilisés.
              Finalisez votre cotisation par virement et envoyez votre preuve.
            </p>
          </div>
          <Button asChild>
            <Link href={paymentHref}>Aller à la page paiement</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
