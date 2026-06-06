import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { markAttendanceAction } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RegisteredChild } from "@/types/activity";

type AttendancePanelProps = {
  activityId: string;
  registrations: RegisteredChild[];
};

export function AttendancePanel({
  activityId,
  registrations,
}: AttendancePanelProps) {
  if (registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Présences</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Inscris des enfants pour pouvoir marquer les présences.
        </CardContent>
      </Card>
    );
  }

  const markPresent = markAttendanceAction.bind(null, activityId);
  const markAbsent = markAttendanceAction.bind(null, activityId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Présences</CardTitle>
        <CardDescription>
          Tape sur Présent ou Absent — simple et rapide sur le terrain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {registrations.map((child) => (
          <div
            key={child.registration_id}
            className="rounded-lg border p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {child.first_name} {child.last_name}
                </p>
                {child.allergies ? (
                  <p className="flex items-center gap-1 text-xs text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    {child.allergies}
                  </p>
                ) : null}
              </div>
              {child.is_present === true ? (
                <Badge variant="success">Présent</Badge>
              ) : child.is_present === false ? (
                <Badge variant="muted">Absent</Badge>
              ) : (
                <Badge variant="warning">Non marqué</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <form action={markPresent}>
                <input type="hidden" name="child_id" value={child.child_id} />
                <input type="hidden" name="is_present" value="true" />
                <Button
                  type="submit"
                  variant={child.is_present === true ? "default" : "outline"}
                  className="w-full"
                  size="sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Présent
                </Button>
              </form>
              <form action={markAbsent}>
                <input type="hidden" name="child_id" value={child.child_id} />
                <input type="hidden" name="is_present" value="false" />
                <Button
                  type="submit"
                  variant={child.is_present === false ? "destructive" : "outline"}
                  className="w-full"
                  size="sm"
                >
                  <XCircle className="h-4 w-4" />
                  Absent
                </Button>
              </form>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
