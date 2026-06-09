import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Phone, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { getChildById } from "@/lib/data/children";
import { getChildOverview } from "@/lib/data/child-overview";
import { archiveChildAction } from "@/lib/actions/children";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  canModifyChild,
  canDeleteChild,
  canViewFullChildProfile,
  canManageUsers,
  canManageChildGdpr,
} from "@/lib/auth/permissions";
import { ChildOverviewPanel } from "@/components/enfants/child-overview-panel";
import { ChildGdprPanel } from "@/components/enfants/child-gdpr-panel";
import { ChildSchoolSupportStaffPanel } from "@/components/enfants/child-school-support-staff-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CHILD_STATUS_LABELS,
  GUARDIAN_RELATION_LABELS,
} from "@/lib/validations/child";
import {
  formatBirthDate,
  getChildAge,
  getChildFullName,
} from "@/types/child";

export default async function EnfantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; warning?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, warning } = await searchParams;
  const profile = await getCurrentProfile();
  const child = await getChildById(id);

  if (!child || !profile) {
    notFound();
  }

  const fullView = canViewFullChildProfile(profile.role);
  const overview = fullView ? await getChildOverview(id) : null;
  const canEdit = canModifyChild(profile.role);
  const canArchive = canDeleteChild(profile.role);
  const showGdpr = canManageChildGdpr(profile.role);
  const primaryGuardian =
    child.guardians.find((g) => g.is_primary) ?? child.guardians[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={child.status === "ACTIF" ? "success" : "warning"}>
              {CHILD_STATUS_LABELS[child.status]}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{getChildFullName(child)}</h1>
          <p className="text-muted-foreground">
            {getChildAge(child.birth_date)} ans · Né(e) le{" "}
            {formatBirthDate(child.birth_date)}
          </p>
        </div>
        {canEdit ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/enfants/${child.id}/modifier`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
        ) : null}
      </div>

      {error === "permission" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Tu n&apos;as pas la permission pour cette action.
        </div>
      ) : null}

      {error === "already_anonymized" ? (
        <div className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Cette fiche est déjà anonymisée.
        </div>
      ) : null}

      {error === "anonymize" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          L&apos;anonymisation a échoué. Réessayez ou contactez le support technique.
        </div>
      ) : null}

      {warning ? (
        <div className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Fiche créée, mais : {decodeURIComponent(warning)}
        </div>
      ) : null}

      {!fullView ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            Vue limitée — en tant que {profile.role === "STAGIAIRE" ? "stagiaire" : "bénévole"},
            tu vois uniquement les informations nécessaires sur le terrain.
          </CardContent>
        </Card>
      ) : null}

      {fullView && overview ? (
        <ChildOverviewPanel
          childId={child.id}
          overview={overview}
          showAdminActions={canManageUsers(profile.role)}
        />
      ) : null}

      {canEdit ? <ChildSchoolSupportStaffPanel childId={child.id} /> : null}

      {showGdpr ? (
        <ChildGdprPanel
          childId={child.id}
          childLabel={getChildFullName(child)}
          alreadyAnonymized={Boolean(child.anonymized_at)}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Santé &amp; urgence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>
              <p className="font-medium">Allergies</p>
              <p className="text-muted-foreground">
                {child.allergies || "Aucune allergie signalée"}
              </p>
            </div>
          </div>
          {fullView && child.medical_notes ? (
            <div>
              <p className="font-medium">Notes médicales</p>
              <p className="text-muted-foreground">{child.medical_notes}</p>
            </div>
          ) : null}
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">Contact d&apos;urgence</p>
              <p className="text-muted-foreground">
                {child.emergency_contact_name || "Non renseigné"}
                {child.emergency_contact_phone
                  ? ` · ${child.emergency_contact_phone}`
                  : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autorisations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {child.outing_authorization ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span>
              Sortie : {child.outing_authorization ? "Autorisée" : "Non autorisée"}
            </span>
          </div>
          {fullView ? (
            <div className="flex items-center gap-2">
              {child.image_rights ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span>
                Image : {child.image_rights ? "Autorisée" : "Non autorisée"}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {fullView ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Scolarité</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{child.school_name || "École non renseignée"}</p>
              <p>{child.school_class || "Classe non renseignée"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parent / tuteur principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {primaryGuardian ? (
                <>
                  <p className="font-medium">
                    {GUARDIAN_RELATION_LABELS[primaryGuardian.relation]} ·{" "}
                    {primaryGuardian.first_name} {primaryGuardian.last_name}
                  </p>
                  <p className="text-muted-foreground">{primaryGuardian.phone}</p>
                  {primaryGuardian.email ? (
                    <p className="text-muted-foreground">{primaryGuardian.email}</p>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">Non renseigné</p>
              )}
            </CardContent>
          </Card>

          {child.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes internes</CardTitle>
                <CardDescription>Visible uniquement par l&apos;équipe</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {child.notes}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button asChild variant="outline">
          <Link href="/enfants">Retour à la liste</Link>
        </Button>

        {canArchive ? (
          <form action={archiveChildAction.bind(null, child.id)}>
            <Button type="submit" variant="destructive" className="w-full">
              Archiver cette fiche
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
