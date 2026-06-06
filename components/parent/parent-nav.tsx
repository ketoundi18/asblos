import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/espace-parents", label: "Mes enfants" },
  { href: "/espace-parents/activites", label: "Activités" },
];

export function ParentNav({ pathname }: { pathname: string }) {
  return (
    <nav className="border-b bg-card">
      <div className="mx-auto flex max-w-lg gap-1 px-4">
        {links.map((link) => {
          const active =
            link.href === "/espace-parents"
              ? pathname === "/espace-parents"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
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
