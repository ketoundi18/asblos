import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { isStaffRole, ROLE_LABELS } from "@/lib/auth/roles";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { resolveFlashToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function MonComptePage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (!isStaffRole(profile.role)) redirect("/espace-parents");

  const params = await searchParams;
  const flash = params.success
    ? resolveFlashToast({
        success: params.success,
        audience: "staff",
      })
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon compte</h1>
        <p className="text-muted-foreground">
          Gère ton accès en toute sécurité.
        </p>
      </div>

      {flash ? <ServerNoticeToast flash={flash} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Nom : </span>
            {profile.full_name}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail : </span>
            {profile.email}
          </p>
          <p>
            <span className="text-muted-foreground">Rôle : </span>
            {ROLE_LABELS[profile.role]}
          </p>
        </CardContent>
      </Card>

      <ChangePasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          Retour à Ma journée
        </Link>
      </p>
    </div>
  );
}
