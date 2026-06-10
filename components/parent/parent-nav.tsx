import Link from "next/link";
import { BookOpen, Calendar, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const parentNavLinks = [
  { href: "/espace-parents", label: "Mes enfants", icon: Users },
  { href: "/espace-parents/soutien-scolaire", label: "Soutien", icon: BookOpen },
  { href: "/espace-parents/activites", label: "Activités", icon: Calendar },
] as const satisfies ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
}>;

function isParentNavActive(pathname: string, href: string) {
  if (href === "/espace-parents") return pathname === "/espace-parents";
  return pathname.startsWith(href);
}

export function ParentDesktopNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="hidden border-b bg-card lg:block"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg gap-1 px-4">
        {parentNavLinks.map((link) => {
          const active = isParentNavActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/5 text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ParentMobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {parentNavLinks.map((link) => {
          const Icon = link.icon;
          const active = isParentNavActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
