"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDE_ON_PREFIXES = [
  "/espace-parents/inscrire",
  "/espace-parents/paiement",
  "/espace-parents/choisir-creneaux",
];

function shouldShowFab(pathname: string) {
  return !HIDE_ON_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function ParentInscribeFab() {
  const pathname = usePathname();

  if (!shouldShowFab(pathname)) {
    return null;
  }

  return (
    <Link
      href="/espace-parents/inscrire"
      aria-label="Inscrire un enfant"
      className={cn(
        "fixed z-20 flex h-14 min-h-14 w-14 min-w-14 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-lg ring-4 ring-background",
        "transition-transform active:scale-95 hover:bg-primary/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 lg:hidden"
      )}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden />
      <span className="sr-only">Inscrire</span>
    </Link>
  );
}
