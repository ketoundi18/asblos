import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageChildGdpr } from "@/lib/auth/permissions";
import { buildChildGdprExport } from "@/lib/data/child-gdpr-export";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active || !canManageChildGdpr(profile.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await context.params;
  const payload = await buildChildGdprExport(id);

  if (!payload) {
    return NextResponse.json({ error: "Enfant introuvable." }, { status: 404 });
  }

  const filename = `asblos-export-${id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
