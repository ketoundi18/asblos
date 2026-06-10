"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canClockStaffTime } from "@/lib/auth/permissions";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { getAuditIpHash } from "@/lib/audit/request-ip";
import { reportError } from "@/lib/monitoring/report-error";
import { catchUpStaffTimeSettlements } from "@/lib/staff-time/settlement";

function mapStaffTimeError(message: string): string {
  if (message.includes("does not exist")) return "migration";
  if (message.includes("staff_time_entries_one_open")) return "service-open";
  return "db";
}

function redirectStaffTimeError(code: string, context: Record<string, unknown>): never {
  void reportError(new Error(`staff-time:${code}`), context);
  redirect(`/mon-service?error=${code}`);
}

export async function startStaffServiceAction() {
  const profile = await requireProfile();

  if (!canClockStaffTime(profile.role)) {
    redirect("/?error=permission");
  }

  const supabase = await createClient();

  try {
    await catchUpStaffTimeSettlements(profile.id);
  } catch (err) {
    void reportError(err instanceof Error ? err : new Error("settlement catch-up failed"), {
      action: "startStaffServiceAction.settlement",
      userId: profile.id,
    });
  }

  const { data, error } = await supabase
    .from("staff_time_entries")
    .insert({
      user_id: profile.id,
      status: "OPEN",
    })
    .select("id")
    .single();

  if (error || !data) {
    const code = mapStaffTimeError(error?.message ?? "unknown");
    if (error?.code === "23505" || code === "service-open") {
      redirect("/mon-service?error=service-open");
    }
    redirectStaffTimeError(code, {
      action: "startStaffServiceAction",
      userId: profile.id,
      pgCode: error?.code,
    });
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "STAFF_CLOCK_IN",
    entityType: "staff_time_entries",
    entityId: data.id,
    actorId: profile.id,
    actorRole: profile.role,
    ipHash,
  });

  revalidatePath("/mon-service");
  redirect("/mon-service?success=service-started");
}

export async function endStaffServiceAction() {
  const profile = await requireProfile();

  if (!canClockStaffTime(profile.role)) {
    redirect("/?error=permission");
  }

  const supabase = await createClient();

  const { data: openEntry, error: fetchError } = await supabase
    .from("staff_time_entries")
    .select("id")
    .eq("user_id", profile.id)
    .eq("status", "OPEN")
    .is("ended_at", null)
    .maybeSingle();

  if (fetchError) {
    redirectStaffTimeError(mapStaffTimeError(fetchError.message), {
      action: "endStaffServiceAction.fetch",
      userId: profile.id,
      pgCode: fetchError.code,
    });
  }

  if (!openEntry) {
    redirect("/mon-service?error=service-none");
  }

  const endedAt = new Date().toISOString();

  const { data: closedRows, error: updateError } = await supabase
    .from("staff_time_entries")
    .update({
      ended_at: endedAt,
      status: "CLOSED",
    })
    .eq("id", openEntry.id)
    .eq("user_id", profile.id)
    .eq("status", "OPEN")
    .select("id");

  if (updateError) {
    redirectStaffTimeError(mapStaffTimeError(updateError.message), {
      action: "endStaffServiceAction.update",
      userId: profile.id,
      entryId: openEntry.id,
      pgCode: updateError.code,
    });
  }

  if (!closedRows?.length) {
    redirect("/mon-service?error=service-none");
  }

  const ipHash = await getAuditIpHash();
  await logAuditEvent({
    action: "STAFF_CLOCK_OUT",
    entityType: "staff_time_entries",
    entityId: openEntry.id,
    actorId: profile.id,
    actorRole: profile.role,
    metadata: { ended_at: endedAt },
    ipHash,
  });

  revalidatePath("/mon-service");
  redirect("/mon-service?success=service-ended");
}
