import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canExportReports } from "@/lib/auth/permissions";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default async function RapportsPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canExportReports(profile.role)) {
    redirect("/");
  }

  return (
    <PlaceholderPage
      title="Rapports"
      description="Module 5 — Les exports PDF et Excel arriveront ici."
    />
  );
}
