import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthPageShell } from "@/components/ui/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";
import { isPasswordRecoverySession } from "@/lib/auth/recovery-session";
import type { PasswordResetChannel } from "@/lib/validations/password-reset";

type PageProps = {
  searchParams: Promise<{ channel?: string }>;
};

function parseChannel(raw: string | undefined): PasswordResetChannel {
  return raw === "parent" ? "parent" : "staff";
}

export default async function NouveauMotDePassePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const channel = parseChannel(params.channel);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      channel === "parent"
        ? "/espace-parents/mot-de-passe-oublie?error=lien-expire"
        : "/connexion/mot-de-passe-oublie?error=lien-expire"
    );
  }

  const recoverySession = await isPasswordRecoverySession(supabase);
  if (!recoverySession) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>();

    if (profile?.role === "PARENT" || channel === "parent") {
      redirect("/espace-parents");
    }
    redirect("/mon-compte");
  }

  const loginHref =
    channel === "parent" ? "/espace-parents/connexion" : "/connexion";

  return (
    <AuthPageShell
      title="Nouveau mot de passe"
      description="Choisis un mot de passe sécurisé (minimum 8 caractères)."
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Définir le mot de passe</CardTitle>
          <CardDescription className="text-base">
            Ce lien est valable un temps limité. Une fois enregistré, tu pourras te
            connecter avec ton nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResetPasswordForm channel={channel} />
          <ButtonLink href={loginHref} />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}

function ButtonLink({ href }: { href: string }) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
        Retour à la connexion
      </Link>
    </p>
  );
}
