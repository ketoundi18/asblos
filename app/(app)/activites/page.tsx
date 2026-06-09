import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { getActivitiesList } from "@/lib/data/activities";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageActivities } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ACTIVITY_STATUS_LABELS } from "@/lib/validations/activity";
import { getLocalTodayISO } from "@/lib/date-utils";
import {
  formatActivityDate,
  formatActivityTime,
  formatActivityPrice,
  isActivityPaid,
  type Activity,
  type ActivityStatus,
} from "@/types/activity";

function statusVariant(status: ActivityStatus) {
  if (status === "PLANIFIEE") return "default";
  if (status === "EN_COURS") return "success";
  if (status === "TERMINEE") return "muted";
  return "warning";
}

export default async function ActivitesPage() {
  const profile = await getCurrentProfile();
  const { activities, loadError } = await getActivitiesList();
  const canCreate = profile ? canManageActivities(profile.role) : false;

  const today = getLocalTodayISO();
  const upcoming = activities.filter((a) => a.activity_date >= today);
  const past = activities.filter((a) => a.activity_date < today);

  return (
    <div className="space-y-6">
      {loadError ? (
        <div
          className="rounded-md alert-banner-warning"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activités</h1>
          <p className="text-muted-foreground">
            {activities.length} activité{activities.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/activites/nouveau">
              <Plus className="h-4 w-4" />
              Nouvelle
            </Link>
          </Button>
        ) : null}
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aucune activité pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground">
                Crée ta première sortie ou atelier.
              </p>
            </div>
            {canCreate ? (
              <Button asChild>
                <Link href="/activites/nouveau">Créer une activité</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                À venir
              </h2>
              {upcoming.map((activity) => (
                <ActivityCard key={activity.id} activity={activity as Activity} />
              ))}
            </section>
          ) : null}
          {past.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Passées
              </h2>
              {past.map((activity) => (
                <ActivityCard key={activity.id} activity={activity as Activity} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const timeLabel = [formatActivityTime(activity.start_time), formatActivityTime(activity.end_time)]
    .filter(Boolean)
    .join(" – ");

  return (
    <Link href={`/activites/${activity.id}`}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{activity.title}</p>
                <Badge variant={statusVariant(activity.status)}>
                  {ACTIVITY_STATUS_LABELS[activity.status]}
                </Badge>
                <Badge variant={isActivityPaid(activity.price_cents) ? "warning" : "success"}>
                  {formatActivityPrice(activity.price_cents)}
                </Badge>
                {activity.parent_registration_open ? (
                  <Badge variant="success">Visible parents</Badge>
                ) : (
                  <Badge variant="warning">Interne</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatActivityDate(activity.activity_date)}
                {timeLabel ? ` · ${timeLabel}` : ""}
              </p>
              {activity.location ? (
                <p className="text-sm text-muted-foreground">{activity.location}</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
