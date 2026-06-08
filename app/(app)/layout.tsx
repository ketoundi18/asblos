import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_LABELS, isParentRole } from "@/lib/auth/roles";
import { LogoutButton } from "@/components/auth/logout-button";
import { StaffDesktopNav, StaffMobileNav } from "@/components/staff/staff-nav";
import type { UserRole } from "@/lib/auth/roles";

const navItems: {
  href: string;
  label: string;
  roles?: UserRole[];
}[] = [
  { href: "/", label: "Ma journée" },
  { href: "/enfants", label: "Enfants" },
  { href: "/planning", label: "Planning" },
  { href: "/activites", label: "Activités" },
  { href: "/soutien-scolaire", label: "Soutien", roles: ["ADMIN", "TRAVAILLEUR"] },
  { href: "/paiements", label: "Paiements", roles: ["ADMIN", "TRAVAILLEUR"] },
  { href: "/rapports", label: "Rapports", roles: ["ADMIN"] },
  { href: "/administration", label: "Familles", roles: ["ADMIN"] },
];

function canSeeItem(role: UserRole, roles?: UserRole[]) {
  if (!roles) return true;
  return roles.includes(role);
}

/** 5 entrées max en barre mobile — ordre métier par rôle (évite slice(0,5) qui masquait des liens). */
const MOBILE_NAV_HREFS: Partial<Record<UserRole, string[]>> = {
  ADMIN: ["/", "/enfants", "/planning", "/activites", "/administration"],
  TRAVAILLEUR: ["/", "/enfants", "/soutien-scolaire", "/activites", "/paiements"],
};

function buildMobileNavItems(
  visibleNav: { href: string; label: string }[],
  role: UserRole
) {
  const preferred = MOBILE_NAV_HREFS[role];
  if (preferred) {
    const byHref = new Map(visibleNav.map((item) => [item.href, item]));
    return preferred
      .map((href) => byHref.get(href))
      .filter((item): item is { href: string; label: string } => Boolean(item));
  }
  return visibleNav.slice(0, 5);
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

  if (isParentRole(profile.role)) {
    redirect("/espace-parents");
  }

  if (!profile.is_active) {
    redirect("/connexion");
  }

  const visibleNav = navItems.filter((item) =>
    canSeeItem(profile.role, item.roles)
  );
  const mobileNav = buildMobileNavItems(visibleNav, profile.role);

  return (
    <div className="flex min-h-screen flex-col pb-20 lg:pb-0">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="min-w-0">
              <p className="text-sm font-semibold">AsblOS</p>
              <p className="truncate text-xs text-muted-foreground">
                {profile.full_name} · {ROLE_LABELS[profile.role]}
              </p>
            </Link>
            <LogoutButton />
          </div>
          <StaffDesktopNav items={visibleNav} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <StaffMobileNav items={mobileNav} />
    </div>
  );
}
