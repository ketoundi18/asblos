import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/permissions";
import { getAsblSettingsForCurrentYear } from "@/lib/data/asbl-settings";
import { getParentLinksForAdmin } from "@/lib/data/parent-admin";
import { AsblSettingsPanel } from "@/components/admin/asbl-settings-panel";
import { ParentLinksPanel } from "@/components/admin/parent-links-panel";

export default async function AdministrationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const profile = await getCurrentProfile();
  const { error, success } = await searchParams;

  if (!profile || !canManageUsers(profile.role)) {
    redirect("/");
  }

  const { links, loadError } = await getParentLinksForAdmin();
  const { settings, loadError: settingsError } = await getAsblSettingsForCurrentYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Valide les comptes parents — un clic, sans SQL.
        </p>
      </div>

      {error === "permission" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Tu n&apos;as pas la permission pour cette action.
        </div>
      ) : null}
      {error === "payment-required" ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Ce parent n&apos;a pas encore payé. Attends le paiement avant de valider.
        </div>
      ) : null}
      {error === "validate" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Impossible de valider ce lien. Réessaie.
        </div>
      ) : null}
      {error === "reject" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Impossible de refuser ce lien. Lance 009_parent_links_delete.sql dans Supabase.
        </div>
      ) : null}
      {success === "validated" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          Lien parent validé. Le parent voit maintenant son enfant.
        </div>
      ) : null}
      {success === "rejected" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          Demande refusée et supprimée.
        </div>
      ) : null}
      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      {success === "fee-updated" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          Cotisation annuelle mise à jour.
        </div>
      ) : null}
      {error === "fee" || error === "fee-save" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Impossible d&apos;enregistrer la cotisation. Lance 014_memberships_v2.sql dans Supabase.
        </div>
      ) : null}
      {settingsError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {settingsError}
        </div>
      ) : null}

      {settings ? <AsblSettingsPanel settings={settings} /> : null}

      <ParentLinksPanel links={links} />
    </div>
  );
}
