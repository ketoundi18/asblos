import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default async function AdministrationPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canManageUsers(profile.role)) {
    redirect("/");
  }

  return (
    <PlaceholderPage
      title="Administration"
      description="Gestion des comptes utilisateurs — disponible dans une prochaine étape."
    />
  );
}
