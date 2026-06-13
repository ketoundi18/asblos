import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft, Clock } from "lucide-react";
import {
  getParentActivityById,
  getParentVerifiedChildrenForRegistration,
} from "@/lib/data/parent-activities";
import { ParentActivityRegisterForm } from "@/components/parent/parent-activity-register-form";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatActivityDate,
  formatActivityTime,
  formatActivityPrice,
  isActivityPaid,
  getParentParticipationHint,
} from "@/types/activity";

export default async function ParentActiviteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getParentActivityById(id);

  if (!activity) notFound();

  const children = await getParentVerifiedChildrenForRegistration();
  const registeredIds = new Set(activity.my_registered_child_ids);
  const availableChildren = children.filter((c) => !registeredIds.has(c.id));
  const eligibleCount = availableChildren.filter((c) => c.eligibility.allowed).length;
  const registrationByChild = new Map(
    (activity.my_registrations ?? []).map((r) => [r.child_id, r.payment_status])
  );

  const timeLabel = [
    formatActivityTime(activity.start_time),
    formatActivityTime(activity.end_time),
  ]
    .filter(Boolean)
    .join(" – ");

  const isPaid = isActivityPaid(activity.price_cents);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/espace-parents/activites">
          <ArrowLeft className="h-4 w-4" />
          Retour aux activités
        </Link>
      </Button>

      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant={isPaid ? "warning" : "success"}>
            {formatActivityPrice(activity.price_cents)}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">{activity.title}</h1>
        <p className="text-muted-foreground">{formatActivityDate(activity.activity_date)}</p>
        {timeLabel ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" />
            {timeLabel}
          </p>
        ) : null}
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
          {activity.description ? (
            <p className="text-muted-foreground">{activity.description}</p>
          ) : null}
          {activity.max_participants ? (
            <p className="text-muted-foreground">
              {activity.registration_count} / {activity.max_participants} places
            </p>
          ) : null}
        </CardContent>
      </Card>

      {registeredIds.size > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tes inscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {children
              .filter((c) => registeredIds.has(c.id))
              .map((c) => {
                const status = registrationByChild.get(c.id) ?? "NOT_REQUIRED";
                const hint = getParentParticipationHint(status);
                return (
                  <div key={c.id} className="space-y-2">
                    <p className="font-medium">
                      {c.first_name} {c.last_name} —{" "}
                      <span className="text-success-foreground">Inscrit</span>
                    </p>
                    {hint ? (
                      <p className="text-sm text-muted-foreground">{hint}</p>
                    ) : null}
                    {status === "PENDING" && isPaid ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/espace-parents/paiement-activite/${id}/${c.id}`}>
                          Payer par virement
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      ) : null}

      {availableChildren.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Inscrire un enfant</CardTitle>
          </CardHeader>
          <CardContent>
            {eligibleCount === 0 ? (
              <p className="mb-4 text-sm text-muted-foreground">
                Vos enfants sont bien enregistrés, mais l&apos;inscription aux activités
                sera possible dès que l&apos;ASBL aura validé le dossier (ou la cotisation si
                applicable).
              </p>
            ) : null}
            <ParentActivityRegisterForm
              activityId={id}
              priceCents={activity.price_cents}
              availableChildren={availableChildren}
            />
          </CardContent>
        </Card>
      ) : null}

      {children.length === 0 ? (
        <ServerNoticeToast
          flash={{
            type: "info",
            title: "Aucun enfant validé",
            description:
              "L'ASBL doit valider le lien parent-enfant dans Administration.",
          }}
        />
      ) : null}
    </div>
  );
}