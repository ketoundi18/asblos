import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthPageShell } from "@/components/ui/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function StaffForgotPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const linkExpired = params.error === "lien-expire";

  return (
    <AuthPageShell
      title="Mot de passe oublié"
      description="On t'envoie un lien sécurisé par e-mail pour choisir un nouveau mot de passe."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Espace parents ?{" "}
          <Link
            href="/espace-parents/mot-de-passe-oublie"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Mot de passe oublié parent
          </Link>
        </p>
      }
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Réinitialisation</CardTitle>
          <CardDescription className="text-base">
            Saisis l&apos;e-mail de ton compte équipe. Si tu ne reçois rien, vérifie
            les spams ou contacte l&apos;administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkExpired ? (
            <div
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien ci-dessous.
            </div>
          ) : null}
          <ForgotPasswordForm channel="staff" loginHref="/connexion" />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
