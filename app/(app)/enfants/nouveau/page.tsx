import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { canCreateChild } from "@/lib/auth/permissions";
import {
  createChildAction,
} from "@/lib/actions/children";
import { emptyFormState } from "@/lib/actions/children-state";
import { ChildForm } from "@/components/enfants/child-form";

export default async function NouvelEnfantPage() {
  const profile = await getCurrentProfile();

  if (!profile || !canCreateChild(profile.role)) {
    redirect("/enfants");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle fiche enfant</h1>
        <p className="text-muted-foreground">
          Remplis les informations essentielles. Tu pourras les modifier plus tard.
        </p>
      </div>
      <ChildForm
        action={createChildAction}
        initialState={emptyFormState}
        submitLabel="Créer la fiche"
      />
    </div>
  );
}
