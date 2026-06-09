import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { getParentActivities } from "@/lib/data/parent-activities";
import { friendlyLoadError } from "@/lib/messages/flash-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatActivityDate,
  formatActivityTime,
  formatActivityPrice,
  isActivityPaid,
} from "@/types/activity";

export default async function ParentActivitesPage() {
  const { activities, loadError } = await getParentActivities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activités</h1>
        <p className="text-muted-foreground">
          Inscrivez vos enfants aux activités proposées par l&apos;ASBL
        </p>
      </div>

      {loadError ? (
        <div className="rounded-md alert-banner-warning">
          {friendlyLoadError(loadError, "parent")}
        </div>
      ) : null}

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="max-w-sm space-y-2">
              <p className="font-medium">Aucune activité disponible</p>
              <p className="text-sm text-muted-foreground">
                L&apos;ASBL doit créer une activité et cocher « Visible dans
                l&apos;espace parents ». Revenez bientôt !
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/espace-parents">Retour — Mes enfants</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {activities.length} activité{activities.length !== 1 ? "s" : ""} à venir
          </p>
          {activities.map((activity) => {
            const timeLabel = [
              formatActivityTime(activity.start_time),
              formatActivityTime(activity.end_time),
            ]
              .filter(Boolean)
              .join(" – ");
            const alreadyRegistered = activity.my_registered_child_ids.length > 0;

            return (
              <Link
                key={activity.id}
                href={`/espace-parents/activites/${activity.id}`}
                className="block"
              >
                <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex gap-0">
                      <div className="flex w-16 shrink-0 flex-col items-center justify-center bg-primary/5 px-2 py-4 text-center">
                        <span className="text-xs font-medium uppercase text-muted-foreground">
                          {new Date(
                            `${activity.activity_date}T12:00:00`
                          ).toLocaleDateString("fr-BE", { month: "short" })}
                        </span>
                        <span className="text-2xl font-bold leading-none">
                          {activity.activity_date.split("-")[2]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-2 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{activity.title}</p>
                          <Badge
                            variant={
                              isActivityPaid(activity.price_cents) ? "warning" : "success"
                            }
                          >
                            {formatActivityPrice(activity.price_cents)}
                          </Badge>
                          {alreadyRegistered ? (
                            <Badge variant="success">Inscrit</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium text-foreground/80">
                          {formatActivityDate(activity.activity_date)}
                        </p>
                        {timeLabel ? (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {timeLabel}
                          </p>
                        ) : null}
                        {activity.location ? (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {activity.location}
                          </p>
                        ) : null}
                        {activity.max_participants ? (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {activity.registration_count} / {activity.max_participants}{" "}
                            places
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
