import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft } from "lucide-react";
import {
  getParentActivityById,
  getParentVerifiedChildrenForRegistration,
} from "@/lib/data/parent-activities";
import { registerParentChildToActivityAction } from "@/lib/actions/parent-activities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatActivityDate,
  formatActivityTime,
  formatActivityPrice,
  isActivityPaid,
} from "@/types/activity";

export default async function ParentActiviteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const activity = await getParentActivityById(id);

  if (!activity) notFound();

  const children = await getParentVerifiedChildrenForRegistration();
  const registeredIds = new Set(activity.my_registered_child_ids);
  const availableChildren = children.filter((c) => !registeredIds.has(c.id));

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
        <p className="text-muted-foreground">
          {formatActivityDate(activity.activity_date)}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </p>
      </div>

      {success === "inscription" ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Inscription enregistrée.
        </div>
      ) : null}
      {error === "payment" ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Cette activité est payante. Le paiement en ligne arrive bientôt — contacte
          l&apos;ASBL pour t&apos;inscrire.
        </div>
      ) : null}
      {error === "inscription" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Impossible de t&apos;inscrire. Lance 013_parent_activities_rls.sql dans Supabase,
          ou l&apos;enfant est déjà inscrit.
        </div>
      ) : null}
      {error === "child" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Choisis un enfant.
        </div>
      ) : null}
      {error === "closed" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Cette activité n&apos;est plus ouverte aux parents.
        </div>
      ) : null}

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
              .map((c) => (
                <p key={c.id} className="font-medium">
                  {c.first_name} {c.last_name} — <span className="text-green-700">Inscrit</span>
                </p>
              ))}
          </CardContent>
        </Card>
      ) : null}

      {!isPaid && availableChildren.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Inscrire un enfant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableChildren.map((child) => {
              const action = registerParentChildToActivityAction.bind(null, id);
              return (
                <form key={child.id} action={action} className="flex gap-2">
                  <input type="hidden" name="child_id" value={child.id} />
                  <Button type="submit" className="w-full">
                    Inscrire {child.first_name} {child.last_name}
                  </Button>
                </form>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {children.length === 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Aucun enfant validé. L&apos;ASBL doit valider le lien parent-enfant dans
          Administration.
        </div>
      ) : null}

      {isPaid && availableChildren.length > 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Activité payante ({formatActivityPrice(activity.price_cents)}). Paiement en
          ligne bientôt disponible — contacte l&apos;ASBL.
        </div>
      ) : null}
    </div>
  );
}
