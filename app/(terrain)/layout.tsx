import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";
import { canMarkAttendance } from "@/lib/auth/permissions";

export default async function TerrainLayout({
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

  if (!canMarkAttendance(profile.role)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link
            href="/activites"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Activités
          </Link>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Présences
          </span>
        </div>
      </div>
      <main className="mx-auto w-full max-w-lg px-4 py-4">{children}</main>
    </div>
  );
}
