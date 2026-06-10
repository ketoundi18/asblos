"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Calendar,
  BookOpen,
  CreditCard,
  FileText,
  Settings,
  Timer,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StaffNavItem = {
  href: string;
  label: string;
};

const ICONS: Record<string, LucideIcon> = {
  "/": LayoutDashboard,
  "/enfants": Users,
  "/mon-service": Timer,
  "/planning": CalendarDays,
  "/activites": Calendar,
  "/soutien-scolaire": BookOpen,
  "/paiements": CreditCard,
  "/rapports": FileText,
  "/equipe": UsersRound,
  "/administration": Settings,
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function StaffDesktopNav({ items }: { items: StaffNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="hidden border-t lg:flex lg:gap-1 lg:px-4 lg:py-2"
      aria-label="Navigation principale"
    >
      {items.map((item) => {
        const Icon = ICONS[item.href] ?? LayoutDashboard;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StaffMobileNav({ items }: { items: StaffNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutDashboard;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
