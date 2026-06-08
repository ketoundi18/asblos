"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canManageActivities } from "@/lib/auth/permissions";
import { getCurrentSchoolYear } from "@/lib/school-year";

export async function createSchoolSupportProgramAction(formData: FormData) {
  const profile = await requireProfile();
  if (!canManageActivities(profile.role)) {
    redirect("/soutien-scolaire?error=permission");
  }

  const title = formData.get("title");
  const description = formData.get("description");
  const maxRaw = formData.get("max_participants");

  if (typeof title !== "string" || !title.trim()) {
    redirect("/soutien-scolaire/nouveau?error=title");
  }

  let max_participants: number | null = null;
  if (typeof maxRaw === "string" && maxRaw.trim()) {
    const n = parseInt(maxRaw, 10);
    if (Number.isFinite(n) && n > 0) max_participants = n;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_support_programs")
    .insert({
      school_year: getCurrentSchoolYear(),
      title: title.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      max_participants,
      status: "DRAFT",
      parent_registration_open: false,
      created_by: profile.id,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect("/soutien-scolaire/nouveau?error=save");
  }

  revalidatePath("/soutien-scolaire");
  redirect(`/soutien-scolaire/${data.id}?success=created`);
}

export async function addSchoolSupportSlotAction(programId: string, formData: FormData) {
  const profile = await requireProfile();
  if (!canManageActivities(profile.role)) {
    redirect(`/soutien-scolaire/${programId}?error=permission`);
  }

  const dayRaw = formData.get("day_of_week");
  const startTime = formData.get("start_time");
  const endTime = formData.get("end_time");
  const location = formData.get("location");
  const label = formData.get("label");

  const day_of_week = typeof dayRaw === "string" ? parseInt(dayRaw, 10) : NaN;
  if (!Number.isFinite(day_of_week) || day_of_week < 1 || day_of_week > 7) {
    redirect(`/soutien-scolaire/${programId}?error=slot-day`);
  }
  if (typeof startTime !== "string" || !startTime) {
    redirect(`/soutien-scolaire/${programId}?error=slot-time`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("school_support_slots").insert({
    program_id: programId,
    day_of_week,
    start_time: startTime,
    end_time: typeof endTime === "string" && endTime ? endTime : null,
    location: typeof location === "string" && location.trim() ? location.trim() : null,
    label: typeof label === "string" && label.trim() ? label.trim() : null,
  } as never);

  if (error) {
    redirect(`/soutien-scolaire/${programId}?error=slot-save`);
  }

  revalidatePath(`/soutien-scolaire/${programId}`);
  redirect(`/soutien-scolaire/${programId}?success=slot-added`);
}

export async function updateSchoolSupportProgramAction(
  programId: string,
  formData: FormData
) {
  const profile = await requireProfile();
  if (!canManageActivities(profile.role)) {
    redirect(`/soutien-scolaire/${programId}?error=permission`);
  }

  const status = formData.get("status");
  const parentOpen = formData.get("parent_registration_open") === "on";

  const updates: Record<string, unknown> = {
    updated_by: profile.id,
    parent_registration_open: parentOpen,
  };

  if (
    status === "DRAFT" ||
    status === "OPEN" ||
    status === "CLOSED"
  ) {
    updates.status = status;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("school_support_programs")
    .update(updates as never)
    .eq("id", programId)
    .is("deleted_at", null);

  if (error) {
    redirect(`/soutien-scolaire/${programId}?error=update`);
  }

  revalidatePath("/soutien-scolaire");
  redirect(`/soutien-scolaire/${programId}?success=updated`);
}

export async function publishSchoolSupportProgramAction(programId: string) {
  const profile = await requireProfile();
  if (!canManageActivities(profile.role)) {
    redirect(`/soutien-scolaire/${programId}?error=permission`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("school_support_programs")
    .update({
      status: "OPEN",
      parent_registration_open: true,
      updated_by: profile.id,
    } as never)
    .eq("id", programId)
    .is("deleted_at", null);

  if (error) {
    redirect(`/soutien-scolaire/${programId}?error=update`);
  }

  revalidatePath("/soutien-scolaire");
  revalidatePath(`/soutien-scolaire/${programId}`);
  revalidatePath("/espace-parents/soutien-scolaire");
  redirect(`/soutien-scolaire/${programId}?success=published`);
}
