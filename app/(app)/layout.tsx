import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { LogoutButton } from "@/components/auth/logout-button";
import { Home, Users, Calendar, CreditCard, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/roles";

const navItems: {
  href: string;
  label: string;
  icon: typeof Home;
  roles?: UserRole[];
}[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/enfants", label: "Enfants", icon: Users },
  { href: "/activites", label: "Activités", icon: Calendar },
  { href: "/paiements", label: "Paiements", icon: CreditCard, roles: ["ADMIN", "TRAVAILLEUR"] },
  { href: "/rapports", label: "Rapports", icon: FileText, roles: ["ADMIN"] },
  { href: "/administration", label: "Admin", icon: Settings, roles: ["ADMIN"] },
];

function canSeeItem(role: UserRole, roles?: UserRole[]) {
  if (!roles) return true;
  return roles.includes(role);
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/connexion");
  }

  if (!profile.is_active) {
    redirect("/connexion");
  }

  const visibleNav = navItems.filter((item) =>
    canSeeItem(profile.role, item.roles)
  );

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">AsblOS</p>
            <p className="text-xs text-muted-foreground">
              {profile.full_name} · {ROLE_LABELS[profile.role]}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-card md:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {visibleNav.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
