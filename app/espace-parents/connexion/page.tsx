import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthPageShell } from "@/components/ui/auth-page-shell";
import { ParentLoginForm } from "@/components/auth/parent-login-form";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { resolveFlashToast } from "@/lib/messages/flash-messages";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function ParentConnexionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const flash =
    params.success || params.error
      ? resolveFlashToast({
          success: params.success,
          error: params.error,
          audience: "parent",
        })
      : null;

  return (
    <AuthPageShell
      title="Connexion"
      description="Accédez aux inscriptions et au suivi de vos enfants."
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/espace-parents/inscription"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Créer un compte
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Personnel ASBL ?{" "}
            <Link href="/connexion" className="underline-offset-4 hover:underline">
              Connexion staff
            </Link>
          </p>
        </>
      }
    >
      {flash ? <ServerNoticeToast flash={flash} /> : null}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Votre espace sécurisé</CardTitle>
          <CardDescription className="text-base">
            Vos données sont protégées. L&apos;ASBL valide chaque lien parent-enfant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParentLoginForm />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
