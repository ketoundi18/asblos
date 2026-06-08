import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users, Smartphone } from "lucide-react";
import {
  getActivityById,
  getActiveChildrenForRegistration,
} from "@/lib/data/activities";
import { getCurrentProfile } from "@/lib/auth/session";
import { canRegisterChildToActivity, canManageActivities, canMarkAttendance } from "@/lib/auth/permissions";
import { AttendancePanel } from "@/components/activites/attendance-panel";
import { RegisterChildForm } from "@/components/activites/register-child-form";
import { ParentVisibilityToggle } from "@/components/activites/parent-visibility-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACTIVITY_STATUS_LABELS } from "@/lib/validations/activity";
import {
  formatActivityDate,
  formatActivityTime,
  formatActivityPrice,
  isActivityPaid,
} from "@/types/activity";

export default async function ActiviteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const activity = await getActivityById(id);

  if (!activity || !profile) notFound();

  const canRegister = canRegisterChildToActivity(profile.role);
  const canManage = canManageActivities(profile.role);
  const canTerrain = canMarkAttendance(profile.role);
  const allChildren = canRegister ? await getActiveChildrenForRegistration() : [];
  const registeredIds = new Set(activity.registrations.map((r) => r.child_id));
  const availableChildren = allChildren.filter((c) => !registeredIds.has(c.id));

  const timeLabel = [
    formatActivityTime(activity.start_time),
    formatActivityTime(activity.end_time),
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="default">
            {ACTIVITY_STATUS_LABELS[activity.status]}
          </Badge>
          <Badge variant={isActivityPaid(activity.price_cents) ? "warning" : "success"}>
            {formatActivityPrice(activity.price_cents)}
          </Badge>
          {activity.parent_registration_open ? (
            <Badge variant="default">Ouverte aux parents</Badge>
          ) : (
            <Badge variant="muted">Interne ASBL</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold">{activity.title}</h1>
        <p className="text-muted-foreground">
          {formatActivityDate(activity.activity_date)}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {activity.location ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {activity.location}
            </p>
          ) : null}
          <p className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {activity.registration_count} inscrit
            {activity.registration_count !== 1 ? "s" : ""}
            {activity.present_count > 0
              ? ` · ${activity.present_count} présent${activity.present_count !== 1 ? "s" : ""}`
              : ""}
          </p>
          {activity.description ? (
            <p className="text-muted-foreground">{activity.description}</p>
          ) : null}
        </CardContent>
      </Card>

      {canManage ? (
        <ParentVisibilityToggle
          activityId={id}
          isOpen={activity.parent_registration_open}
        />
      ) : null}

      {canRegister ? (
        <RegisterChildForm activityId={id} availableChildren={availableChildren} />
      ) : null}

      {canTerrain && activity.registrations.length > 0 ? (
        <Button asChild size="lg" className="w-full h-14 text-base">
          <Link href={`/activites/${id}/terrain`}>
            <Smartphone className="h-5 w-5" />
            Marquer les présences
          </Link>
        </Button>
      ) : null}

      <AttendancePanel
        activityId={id}
        registrations={activity.registrations}
        showPaymentStatus={isActivityPaid(activity.price_cents)}
      />

      <Button asChild variant="outline" className="w-full">
        <Link href="/activites">Retour à la liste</Link>
      </Button>
    </div>
  );
}
