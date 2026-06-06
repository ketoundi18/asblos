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

type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];

function mapFieldErrors(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (!fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

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

function emptyToNull(value?: string) {
  return value && value.trim() !== "" ? value.trim() : null;
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
    start_time: emptyToNull(data.start_time),
    end_time: emptyToNull(data.end_time),
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
    .insert(payload as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !activity) {
    const detail = error?.message ?? "";
    const needs012 =
      detail.includes("price_cents") || detail.includes("parent_registration");
    return {
      error: needs012
        ? "Lance 012_activity_parent_options.sql dans Supabase, puis réessaie."
        : `Impossible de créer l'activité${detail ? ` (${detail})` : ""}.`,
      fieldErrors: {},
    };
  }

  revalidatePath("/activites");
  redirect(`/activites/${activity.id}`);
}

export async function registerChildAction(
  activityId: string,
  formData: FormData
) {
  const profile = await requireProfile();
  if (!canRegisterChildToActivity(profile.role)) {
    redirect(`/activites/${activityId}?error=permission`);
  }

  const childId = formData.get("child_id");
  if (typeof childId !== "string" || !childId) {
    redirect(`/activites/${activityId}?error=inscription`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("activity_registrations").insert({
    activity_id: activityId,
    child_id: childId,
    registered_by: profile.id,
  } as never);

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
  const profile = await requireProfile();
  if (!canMarkAttendance(profile.role)) return;

  const childId = formData.get("child_id");
  const isPresent = formData.get("is_present") === "true";

  if (typeof childId !== "string" || !childId) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("activity_attendance")
    .select("id")
    .eq("activity_id", activityId)
    .eq("child_id", childId)
    .maybeSingle<{ id: string }>();

  if (existing?.id) {
    await supabase
      .from("activity_attendance")
      .update({
        is_present: isPresent,
        marked_by: profile.id,
        marked_at: new Date().toISOString(),
      } as never)
      .eq("id", existing.id);
  } else {
    await supabase.from("activity_attendance").insert({
      activity_id: activityId,
      child_id: childId,
      is_present: isPresent,
      marked_by: profile.id,
    } as never);
  }

  revalidatePath(`/activites/${activityId}`);
  redirect(`/activites/${activityId}`);
}
