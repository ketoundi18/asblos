import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";
import type { StaffDashboardAction, StaffTodayActivity } from "@/lib/data/staff-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StaffActionCards({ actions }: { actions: StaffDashboardAction[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {actions.map((action) => (
        <Link key={action.id} href={action.href} className="block">
          <Card
            className={cn(
              "h-full transition-all hover:border-primary/40 hover:shadow-sm",
              action.urgent && action.count > 0 && "border-amber-300 bg-amber-50/40"
            )}
          >
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{action.title}</p>
                  {action.count > 0 ? (
                    <Badge variant={action.urgent ? "warning" : "default"}>
                      {action.count}
                    </Badge>
                  ) : action.id === "all-clear" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function StaffTodayActivitiesPanel({
  activities,
}: {
  activities: StaffTodayActivity[];
}) {
  if (activities.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Aujourd&apos;hui sur le terrain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-muted-foreground">
                {activity.timeLabel} · {activity.registrationCount} inscrit
                {activity.registrationCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Button asChild size="sm" variant="default" className="shrink-0">
              <Link href={`/activites/${activity.id}/terrain`}>Marquer les présences</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
