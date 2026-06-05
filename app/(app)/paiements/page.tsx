import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canRecordPayment } from "@/lib/auth/permissions";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default async function PaiementsPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canRecordPayment(profile.role)) {
    redirect("/");
  }

  return (
    <PlaceholderPage
      title="Paiements"
      description="Module 4 — Le suivi des paiements arrivera ici."
    />
  );
}
