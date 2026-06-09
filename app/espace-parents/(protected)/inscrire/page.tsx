import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { ParentEnrollmentForm } from "@/components/parent/parent-enrollment-form";
import { Button } from "@/components/ui/button";
import {
  getAsblSettingsForCurrentYear,
  formatEnrollmentFeeLabel,
  getSchoolSupportFeeCents,
} from "@/lib/data/asbl-settings";
import {
  childNeedsMembershipPayment,
  getChildPaymentContext,
} from "@/lib/data/parent-payments";
import { getMembershipForChildCurrentYear } from "@/lib/data/memberships";
import { getParentOpenSchoolSupportPrograms } from "@/lib/data/school-support";
import { isPaymentSimulationEnabled } from "@/lib/config/payments";
import { isMollieConfigured } from "@/lib/mollie/client";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default async function ParentInscrireEnfantPage({
  searchParams,
}: {
  searchParams: Promise<{
    step?: string;
    childId?: string;
  }>;
}) {
  const profile = await getCurrentProfile();
  const { step, childId: resumeChildId } = await searchParams;

  const stepsRequiringChild = new Set(["jours", "paiement", "termine"]);
  if (step && stepsRequiringChild.has(step) && !resumeChildId) {
    redirect("/espace-parents/inscrire?step=enfant&error=resume");
  }
  const { first, last } = splitFullName(profile?.full_name ?? "");
  const [{ settings }, { programs }] = await Promise.all([
    getAsblSettingsForCurrentYear(),
    getParentOpenSchoolSupportPrograms(),
  ]);
  const supportFee = getSchoolSupportFeeCents(settings);
  const supportFeeLabel = formatEnrollmentFeeLabel(supportFee);
  const mollieReady = isMollieConfigured();
  const simulationEnabled = isPaymentSimulationEnabled();

  let initialChildName = "";
  let initialNeedsPayment = false;
  let initialSchoolSupport = false;

  if (resumeChildId) {
    const supabase = await createClient();
    const [{ data: child }, membership, paymentContext] = await Promise.all([
      supabase
        .from("children")
        .select("first_name")
        .eq("id", resumeChildId)
        .maybeSingle<{ first_name: string }>(),
      getMembershipForChildCurrentYear(resumeChildId),
      getChildPaymentContext(resumeChildId),
    ]);
    initialChildName = child?.first_name ?? "";
    initialSchoolSupport = membership?.plan === "SCHOOL_SUPPORT";
    if (paymentContext) {
      initialNeedsPayment = childNeedsMembershipPayment(paymentContext);
      if (step === "termine" && initialNeedsPayment) {
        redirect(
          `/espace-parents/inscrire?step=paiement&childId=${resumeChildId}&error=payment-required`
        );
      }
    }
  }

  const openPrograms = programs.map((program) => ({
    id: program.id,
    title: program.title,
    description: program.description,
    slots: program.slots,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/espace-parents">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Inscrire un enfant</h1>
        <p className="text-muted-foreground">
          Suivez les étapes pour inscrire votre enfant, choisir la formule et finaliser
          le paiement si nécessaire.
        </p>
      </div>

      <ParentEnrollmentForm
        schoolSupportFeeLabel={supportFeeLabel}
        schoolSupportFeeCents={supportFee}
        openPrograms={openPrograms}
        guardianDefaults={{
          first_name: first,
          last_name: last,
          email: profile?.email ?? "",
          phone: profile?.phone ?? "",
        }}
        mollieReady={mollieReady}
        simulationEnabled={simulationEnabled}
        initialStep={step}
        initialChildId={resumeChildId}
        initialChildName={initialChildName}
        initialNeedsPayment={initialNeedsPayment}
        initialSchoolSupport={initialSchoolSupport}
      />
    </div>
  );
}
