import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { getParentActivities } from "@/lib/data/parent-activities";
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
          Inscris tes enfants aux activités ouvertes par l&apos;ASBL
        </p>
      </div>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      {activities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Aucune activité ouverte pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground">
                L&apos;ASBL doit créer une activité et cocher « Ouverte aux parents ».
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/espace-parents">Retour — Mes enfants</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const timeLabel = [
              formatActivityTime(activity.start_time),
              formatActivityTime(activity.end_time),
            ]
              .filter(Boolean)
              .join(" – ");
            const alreadyRegistered = activity.my_registered_child_ids.length > 0;

            return (
              <Link key={activity.id} href={`/espace-parents/activites/${activity.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{activity.title}</p>
                      <Badge variant={isActivityPaid(activity.price_cents) ? "warning" : "success"}>
                        {formatActivityPrice(activity.price_cents)}
                      </Badge>
                      {alreadyRegistered ? (
                        <Badge variant="success">Inscrit</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatActivityDate(activity.activity_date)}
                      {timeLabel ? ` · ${timeLabel}` : ""}
                    </p>
                    {activity.location ? (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {activity.location}
                      </p>
                    ) : null}
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
