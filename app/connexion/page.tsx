import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthPageShell } from "@/components/ui/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function ConnexionPage() {
  return (
    <AuthPageShell
      title="Connexion staff"
      description="Gestion simple pour ton ASBL — accès réservé à l'équipe."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Pas d&apos;inscription publique — ton administrateur crée ton compte.
          <br />
          <a
            href="/espace-parents/connexion"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Espace parents →
          </a>
        </p>
      }
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Identifiants</CardTitle>
          <CardDescription className="text-base">
            Entre ton e-mail et ton mot de passe pour accéder à l&apos;application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
