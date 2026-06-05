import { notFound, redirect } from "next/navigation";
import { getChildById } from "@/lib/data/children";
import { updateChildAction } from "@/lib/actions/children";
import { emptyFormState } from "@/lib/actions/children-state";
import { getCurrentProfile } from "@/lib/auth/session";
import { canModifyChild } from "@/lib/auth/permissions";
import { ChildForm } from "@/components/enfants/child-form";

export default async function ModifierEnfantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const child = await getChildById(id);

  if (!profile || !canModifyChild(profile.role)) {
    redirect(`/enfants/${id}`);
  }

  if (!child) {
    notFound();
  }

  const boundUpdateAction = updateChildAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier la fiche</h1>
        <p className="text-muted-foreground">
          {child.first_name} {child.last_name}
        </p>
      </div>
      <ChildForm
        action={boundUpdateAction}
        initialState={emptyFormState}
        child={child}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}
