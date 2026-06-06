"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { isParentRole } from "@/lib/auth/roles";

export async function registerParentChildToActivityAction(
  activityId: string,
  formData: FormData
) {
  const profile = await requireProfile();

  if (!isParentRole(profile.role)) {
    redirect(`/espace-parents/activites/${activityId}?error=permission`);
  }

  const childId = formData.get("child_id");
  if (typeof childId !== "string" || !childId) {
    redirect(`/espace-parents/activites/${activityId}?error=child`);
  }

  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("price_cents, max_participants, parent_registration_open")
    .eq("id", activityId)
    .single<{ price_cents: number; max_participants: number | null; parent_registration_open: boolean }>();

  if (!activity?.parent_registration_open) {
    redirect(`/espace-parents/activites/${activityId}?error=closed`);
  }

  if ((activity.price_cents ?? 0) > 0) {
    redirect(`/espace-parents/activites/${activityId}?error=payment`);
  }

  const { error } = await supabase.from("activity_registrations").insert({
    activity_id: activityId,
    child_id: childId,
    registered_by: profile.id,
  } as never);

  if (error) {
    redirect(`/espace-parents/activites/${activityId}?error=inscription`);
  }

  revalidatePath("/espace-parents/activites");
  revalidatePath(`/espace-parents/activites/${activityId}`);
  redirect(`/espace-parents/activites/${activityId}?success=inscription`);
}
