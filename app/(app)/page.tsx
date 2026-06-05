import { getCurrentProfile } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, {profile?.full_name?.split(" ")[0] ?? "!"}
        </h1>
        <p className="text-muted-foreground">
          Bienvenue sur AsblOS — tout est prêt pour commencer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ton compte</CardTitle>
          <CardDescription>Informations de connexion actuelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">E-mail :</span> {profile?.email}
          </p>
          <p>
            <span className="font-medium">Rôle :</span>{" "}
            {profile ? ROLE_LABELS[profile.role] : "—"}
          </p>
          <p>
            <span className="font-medium">Statut :</span>{" "}
            {profile?.is_active ? "Actif" : "Inactif"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">
            Module 1 terminé
          </CardTitle>
          <CardDescription>
            Connexion, rôles et protection des routes fonctionnent. Les
            prochains modules ajouteront enfants, activités, paiements et
            rapports.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
