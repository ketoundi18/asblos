import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock } from "lucide-react";
import { getActivityById } from "@/lib/data/activities";
import { TerrainAttendancePanel } from "@/components/activites/terrain-attendance-panel";
import { Button } from "@/components/ui/button";
import {
  formatActivityDate,
  formatActivityTime,
} from "@/types/activity";

export default async function ActiviteTerrainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivityById(id);

  if (!activity) notFound();

  const timeLabel = [
    formatActivityTime(activity.start_time),
    formatActivityTime(activity.end_time),
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold leading-tight">{activity.title}</h1>
        <p className="text-sm font-medium text-muted-foreground">
          {formatActivityDate(activity.activity_date)}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </p>
        {activity.location ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            {activity.location}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        Tapez un gros bouton — idéal dehors, en marchant, avec des gants.
      </p>

      <TerrainAttendancePanel
        activityId={id}
        registrations={activity.registrations}
      />

      <Button asChild variant="outline" className="w-full" size="lg">
        <Link href={`/activites/${id}`}>
          <Clock className="h-4 w-4" />
          Vue détaillée de l&apos;activité
        </Link>
      </Button>
    </div>
  );
}
