import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { ParentLogoutButton } from "@/components/auth/parent-logout-button";
import { ParentInscribeFab } from "@/components/parent/parent-inscribe-fab";
import { ParentNavClient } from "@/components/parent/parent-nav-client";

export default async function EspaceParentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || !isParentRole(profile.role)) {
    redirect("/espace-parents/connexion");
  }

  if (!profile.is_active) {
    redirect("/espace-parents/connexion");
  }

  return (
    <div className="flex min-h-screen flex-col pb-28 lg:pb-0">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="font-semibold">AsblOS — Espace parents</p>
            <p className="text-xs text-muted-foreground">{profile.full_name}</p>
          </div>
          <ParentLogoutButton />
        </div>
      </header>
      <ParentNavClient />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</main>
      <ParentInscribeFab />
    </div>
  );
}
