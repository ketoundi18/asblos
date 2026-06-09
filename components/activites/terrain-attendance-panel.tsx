import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { markAttendanceAction } from "@/lib/actions/activities";
import type { RegisteredChild } from "@/types/activity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  activityId: string;
  registrations: RegisteredChild[];
};

export function TerrainAttendancePanel({ activityId, registrations }: Props) {
  const markPresent = markAttendanceAction.bind(null, activityId);
  const markAbsent = markAttendanceAction.bind(null, activityId);

  const markedCount = registrations.filter((r) => r.is_present !== null).length;
  const presentCount = registrations.filter((r) => r.is_present === true).length;

  if (registrations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        Aucun enfant inscrit pour cette activité.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 px-4 py-3 text-center">
        <p className="text-2xl font-bold tabular-nums">
          {presentCount}{" "}
          <span className="text-lg font-normal text-muted-foreground">
            / {registrations.length} présents
          </span>
        </p>
        <p className="text-sm text-muted-foreground">
          {markedCount === registrations.length
            ? "Toutes les présences sont marquées"
            : `${registrations.length - markedCount} enfant(s) restant(s)`}
        </p>
      </div>

      <ul className="space-y-4">
        {registrations.map((child) => (
          <li
            key={child.registration_id}
            className={cn(
              "rounded-2xl border-2 p-4 shadow-sm transition-colors",
              child.is_present === true && "border-success bg-success-muted/80",
              child.is_present === false && "border-muted bg-muted/30",
              child.is_present === null && "border-warning-border bg-warning-muted/40"
            )}
          >
            <div className="mb-4 space-y-1">
              <p className="text-xl font-bold leading-tight">
                {child.first_name} {child.last_name}
              </p>
              {child.allergies ? (
                <p className="flex items-center gap-2 rounded-lg bg-warning-muted px-3 py-2 text-sm font-medium text-warning-foreground">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  Allergies : {child.allergies}
                </p>
              ) : null}
              {child.is_present === true ? (
                <p className="flex items-center gap-1 text-sm font-medium text-success-foreground">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Présent
                </p>
              ) : child.is_present === false ? (
                <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <XCircle className="h-4 w-4" aria-hidden />
                  Absent
                </p>
              ) : (
                <p className="text-sm font-medium text-warning-foreground">À marquer</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <form action={markPresent}>
                <input type="hidden" name="child_id" value={child.child_id} />
                <input type="hidden" name="is_present" value="true" />
                <input type="hidden" name="return_to" value="terrain" />
                <Button
                  type="submit"
                  size="lg"
                  variant={child.is_present === true ? "default" : "outline"}
                  className={cn(
                    "h-16 w-full text-base font-semibold",
                    child.is_present === true && "bg-success hover:bg-success/90"
                  )}
                >
                  <CheckCircle2 className="h-6 w-6" aria-hidden />
                  Présent
                </Button>
              </form>
              <form action={markAbsent}>
                <input type="hidden" name="child_id" value={child.child_id} />
                <input type="hidden" name="is_present" value="false" />
                <input type="hidden" name="return_to" value="terrain" />
                <Button
                  type="submit"
                  size="lg"
                  variant={child.is_present === false ? "destructive" : "outline"}
                  className="h-16 w-full text-base font-semibold"
                >
                  <XCircle className="h-6 w-6" aria-hidden />
                  Absent
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
