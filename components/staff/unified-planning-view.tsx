import Link from "next/link";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import type { PlanningDay } from "@/lib/data/unified-planning";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function UnifiedPlanningView({ days }: { days: PlanningDay[] }) {
  const hasAnyItems = days.some((d) => d.items.length > 0);

  if (!hasAnyItems) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Rien de prévu cette semaine</p>
          <p className="mt-1">
            Crée une activité ou un programme de soutien scolaire pour remplir le planning.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <Card
          key={day.date}
          className={cn(day.isToday && "border-primary/30 bg-primary/[0.02]")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{day.dayLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {day.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Rien de prévu ce jour-là.</p>
            ) : (
              day.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {item.kind === "activity" ? (
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium leading-tight">{item.title}</p>
                        <Badge variant={item.kind === "activity" ? "default" : "warning"}>
                          {item.kind === "activity" ? "Activité" : "Soutien"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                    {item.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
