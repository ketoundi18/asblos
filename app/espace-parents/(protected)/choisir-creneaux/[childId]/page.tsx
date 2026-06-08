import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParentChooseSlotsForm } from "@/components/parent/parent-choose-slots-form";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getParentOpenSchoolSupportPrograms } from "@/lib/data/school-support";
import { getMembershipForChildCurrentYear } from "@/lib/data/memberships";

export default async function ParentChoisirCreneauxPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/espace-parents/connexion");

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("child_id")
    .eq("parent_id", profile.id)
    .eq("child_id", childId)
    .maybeSingle<{ child_id: string }>();

  if (!link) notFound();

  const { data: child } = await supabase
    .from("children")
    .select("first_name, last_name")
    .eq("id", childId)
    .is("deleted_at", null)
    .maybeSingle<{ first_name: string; last_name: string }>();

  if (!child) notFound();

  const membership = await getMembershipForChildCurrentYear(childId);
  if (!membership || membership.plan !== "SCHOOL_SUPPORT") {
    redirect("/espace-parents");
  }

  if (membership.status === "AWAITING_PAYMENT" && membership.fee_cents > 0) {
    redirect(`/espace-parents/paiement/${childId}`);
  }

  const { data: existingEnrollment } = await supabase
    .from("school_support_enrollments")
    .select("id")
    .eq("child_id", childId)
    .is("cancelled_at", null)
    .maybeSingle<{ id: string }>();

  if (existingEnrollment) {
    redirect("/espace-parents/soutien-scolaire?success=soutien-slots");
  }

  const { programs } = await getParentOpenSchoolSupportPrograms();
  const childName = `${child.first_name} ${child.last_name}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/espace-parents">
            <ArrowLeft className="h-4 w-4" />
            Mes enfants
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Jours de soutien scolaire</h1>
        <p className="text-muted-foreground">
          Optionnel — pour {childName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quels jours conviennent ?</CardTitle>
        </CardHeader>
        <CardContent>
          <ParentChooseSlotsForm
            childId={childId}
            childName={childName}
            programs={programs.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              slots: p.slots,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
