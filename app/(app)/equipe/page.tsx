import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Timer, CalendarClock } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LINKS = [
  {
    href: "/equipe/membres",
    title: "Membres",
    description: "Créer et gérer les comptes travailleurs, stagiaires et bénévoles.",
    icon: Users,
    available: true,
  },
  {
    href: "/equipe/horaires",
    title: "Objectifs horaires",
    description: "Définir les heures à prester par personne et les jours travaillés.",
    icon: CalendarClock,
    available: true,
  },
  {
    href: "/equipe/rapport",
    title: "Rapport mensuel",
    description: "Heures prestées et soldes de flexibilité — export CSV.",
    icon: Timer,
    available: true,
  },
] as const;

export default async function EquipePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (!canManageUsers(profile.role)) redirect("/?error=permission");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="text-muted-foreground">
          Gère les comptes staff, les objectifs horaires et les rapports mensuels.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => {
          const Icon = item.icon;
          const body = (
            <Card
              className={
                item.available
                  ? "transition-colors hover:border-primary/40 hover:bg-muted/20"
                  : "opacity-60"
              }
            >
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );

          if (!item.available) {
            return <div key={item.title}>{body}</div>;
          }

          return (
            <Link key={item.href} href={item.href} className="block">
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
