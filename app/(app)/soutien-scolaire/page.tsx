import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageActivities } from "@/lib/auth/permissions";
import { getStaffSchoolSupportPrograms } from "@/lib/data/school-support";
import { PROGRAM_STATUS_LABELS } from "@/types/school-support";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SoutienScolairePage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageActivities(profile.role)) {
    redirect("/");
  }

  const { programs, loadError } = await getStaffSchoolSupportPrograms();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Soutien scolaire</h1>
          <p className="text-muted-foreground">
            Offre récurrente — jours, horaires et inscriptions (séparé des activités ponctuelles).
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/soutien-scolaire/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau programme
          </Link>
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aucun programme pour cette année scolaire. Créez le premier pour configurer
            les créneaux (ex. mardi et jeudi 14h–16h).
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <Link key={p.id} href={`/soutien-scolaire/${p.id}`} className="block">
              <Card className="transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <Badge variant={p.status === "OPEN" ? "success" : "muted"}>
                      {PROGRAM_STATUS_LABELS[p.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {p.slots.length} créneau{p.slots.length !== 1 ? "x" : ""} ·{" "}
                  {p.enrollment_count} inscrit{p.enrollment_count !== 1 ? "s" : ""}
                  {p.status === "OPEN" && p.parent_registration_open
                    ? " · Visible parents"
                    : " · Brouillon (invisible parents)"}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
