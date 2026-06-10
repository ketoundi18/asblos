import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { ParentLogoutButton } from "@/components/auth/parent-logout-button";
import { ParentContentArea } from "@/components/parent/parent-content-area";
import { ParentNavClient } from "@/components/parent/parent-nav-client";
import { AsblLogo } from "@/components/ui/asbl-logo";

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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/espace-parents" className="flex min-w-0 items-center gap-3">
            <AsblLogo size="sm" />
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold leading-tight">Espace parents</p>
              <p className="truncate text-xs text-muted-foreground">{profile.full_name}</p>
            </div>
          </Link>
          <ParentLogoutButton />
        </div>
      </header>
      <ParentNavClient />
      <ParentContentArea>{children}</ParentContentArea>
    </div>
  );
}
