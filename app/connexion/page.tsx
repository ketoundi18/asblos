import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthPageShell } from "@/components/ui/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { resolveFlashToast } from "@/lib/messages/flash-messages";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function ConnexionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const flash =
    params.success || params.error
      ? resolveFlashToast({
          success: params.success,
          error: params.error,
          audience: "staff",
        })
      : null;

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
      {flash ? <ServerNoticeToast flash={flash} /> : null}
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
