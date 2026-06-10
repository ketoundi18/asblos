import { randomUUID } from "crypto";
import { type NextRequest } from "next/server";
import { logAuditEvent } from "@/lib/audit/log-audit";
import { reportError } from "@/lib/monitoring/report-error";
import { runDailyStaffTimeSettlement } from "@/lib/staff-time/settlement";
import { verifyCronSecret } from "@/lib/staff-time/verify-cron-secret";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyStaffTimeSettlement();

    await logAuditEvent({
      action: "STAFF_TIME_SETTLEMENT",
      entityType: "staff_time_ledger",
      entityId: randomUUID(),
      metadata: {
        reference_date: result.referenceDate,
        settled_count: result.count,
        source: "cron",
      },
    });

    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/staff-time-settlement]", message);
    await reportError(err instanceof Error ? err : new Error(message), {
      surface: "cron-staff-time-settlement",
    });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
