"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import {
  canManageActivities,
  canRegisterChildToActivity,
  canMarkAttendance,
} from "@/lib/auth/permissions";
import { activityFormSchema } from "@/lib/validations/activity";
import type { Database } from "@/types/database";
import type { ActivityFormState } from "@/lib/actions/activities-state";
import { normalizeTimeForDb } from "@/lib/date-utils";
import { mapActivityInsertError } from "@/lib/messages/map-staff-action-error";
import { emptyToNull, mapFieldErrors } from "@/lib/utils/form-utils";
import { guardUuid, isValidUuid } from "@/lib/validations/uuid";

type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];

function parseActivityForm(formData: FormData) {
  return activityFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    activity_date: formData.get("activity_date"),
    start_time: formData.get("start_time") || undefined,
    end_time: formData.get("end_time") || undefined,
    location: formData.get("location") || undefined,
    max_participants: formData.get("max_participants") || undefined,
    status: formData.get("status") || "PLANIFIEE",
    is_paid: formData.get("is_paid") === "on",
    price_euros: formData.get("price_euros")?.toString() || undefined,
    parent_registration_open: formData.get("parent_registration_open") === "on",
  });
}

function priceEurosToCents(isPaid: boolean, priceEuros?: string): number {
  if (!isPaid) return 0;
  const raw = (priceEuros ?? "").trim().replace(",", ".");
  return Math.round(Number(raw) * 100);
}

export async function createActivityAction(
  _prevState: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
  const profile = await requireProfile();
  if (!canManageActivities(profile.role)) {
    return { error: "Tu n'as pas la permission de créer une activité.", fieldErrors: {} };
  }

  const parsed = parseActivityForm(formData);
  if (!parsed.success) {
    return { error: null, fieldErrors: mapFieldErrors(parsed.error.issues) };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const payload: ActivityInsert = {
    title: data.title.trim(),
    description: emptyToNull(data.description),
    activity_date: data.activity_date,
    start_time: normalizeTimeForDb(data.start_time),
    end_time: normalizeTimeForDb(data.end_time),
    location: emptyToNull(data.location),
    max_participants: data.max_participants ?? null,
    status: data.status,
    price_cents: priceEurosToCents(data.is_paid, data.price_euros),
    parent_registration_open: data.parent_registration_open,
    created_by: profile.id,
    updated_by: profile.id,
  };

  const { data: activity, error } = await supabase
    .from("activities")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();

  if (error || !activity) {
    return {
      error: mapActivityInsertError(error?.message),
      fieldErrors: {},
    };
  }

  revalidatePath("/activites");
  revalidatePath("/espace-parents/activites");
  revalidatePath("/espace-parents", "layout");
  redirect(`/activites/${activity.id}?created=1`);
}

export async function toggleParentRegistrationAction(activityId: string) {
  guardUuid(activityId, "/activites");
  const profile = await requireProfile();
  if (!canManageActivities(profile.role)) {
    redirect(`/activites/${activityId}?error=permission`);
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("activities")
    .select("parent_registration_open")
    .eq("id", activityId)
    .is("deleted_at", null)
    .single<{ parent_registration_open: boolean }>();

  if (!current) {
    redirect(`/activites/${activityId}?error=notfound`);
  }

  const { error } = await supabase
    .from("activities")
    .update({
      parent_registration_open: !current.parent_registration_open,
      updated_by: profile.id,
    })
    .eq("id", activityId);

  if (error) {
    redirect(`/activites/${activityId}?error=toggle`);
  }

  revalidatePath("/activites");
  revalidatePath(`/activites/${activityId}`);
  revalidatePath("/espace-parents/activites");
  revalidatePath("/espace-parents", "layout");
  redirect(`/activites/${activityId}?toggled=parent`);
}

export async function registerChildAction(
  activityId: string,
  formData: FormData
) {
  guardUuid(activityId, "/activites");
  const profile = await requireProfile();
  if (!canRegisterChildToActivity(profile.role)) {
    redirect(`/activites/${activityId}?error=permission`);
  }

  const childId = formData.get("child_id");
  if (typeof childId !== "string" || !childId || !isValidUuid(childId)) {
    redirect(`/activites/${activityId}?error=inscription`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("activity_registrations").insert({
    activity_id: activityId,
    child_id: childId,
    registered_by: profile.id,
  });

  if (error) {
    redirect(`/activites/${activityId}?error=inscription`);
  }

  revalidatePath(`/activites/${activityId}`);
  redirect(`/activites/${activityId}`);
}

export async function markAttendanceAction(
  activityId: string,
  formData: FormData
) {
  guardUuid(activityId, "/activites");
  const profile = await requireProfile();
  if (!canMarkAttendance(profile.role)) {
    redirect(`/activites/${activityId}?error=permission`);
  }

  const childId = formData.get("child_id");
  const isPresent = formData.get("is_present") === "true";

  if (typeof childId !== "string" || !childId || !isValidUuid(childId)) {
    redirect(`/activites/${activityId}?error=attendance`);
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("activity_attendance")
    .select("id")
    .eq("activity_id", activityId)
    .eq("child_id", childId)
    .maybeSingle<{ id: string }>();

  if (existing?.id) {
    const { error } = await supabase
      .from("activity_attendance")
      .update({
        is_present: isPresent,
        marked_by: profile.id,
        marked_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      redirect(`/activites/${activityId}?error=attendance`);
    }
  } else {
    const { error } = await supabase.from("activity_attendance").insert({
      activity_id: activityId,
      child_id: childId,
      is_present: isPresent,
      marked_by: profile.id,
    });

    if (error) {
      redirect(`/activites/${activityId}?error=attendance`);
    }
  }

  revalidatePath(`/activites/${activityId}`);
  revalidatePath(`/activites/${activityId}/terrain`);

  const returnTo = formData.get("return_to");
  if (returnTo === "terrain") {
    redirect(`/activites/${activityId}/terrain?success=attendance`);
  }

  redirect(`/activites/${activityId}`);
}
