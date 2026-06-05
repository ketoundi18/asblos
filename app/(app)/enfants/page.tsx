import Link from "next/link";
import { Plus, User } from "lucide-react";
import { getChildrenList } from "@/lib/data/children";
import { getCurrentProfile } from "@/lib/auth/session";
import { canCreateChild } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CHILD_STATUS_LABELS } from "@/lib/validations/child";
import {
  getChildAge,
  getChildFullName,
  type Child,
} from "@/types/child";

function statusVariant(status: Child["status"]) {
  if (status === "ACTIF") return "success";
  if (status === "INACTIF") return "warning";
  return "muted";
}

export default async function EnfantsPage() {
  const profile = await getCurrentProfile();
  const { children, loadError } = await getChildrenList();
  const canCreate = profile ? canCreateChild(profile.role) : false;

  return (
    <div className="space-y-6">
      {loadError ? (
        <div
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enfants</h1>
          <p className="text-muted-foreground">
            {children.length} fiche{children.length !== 1 ? "s" : ""} active
            {children.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/enfants/nouveau">
              <Plus className="h-4 w-4" />
              Nouveau
            </Link>
          </Button>
        ) : null}
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aucun enfant pour l&apos;instant</p>
              <p className="text-sm text-muted-foreground">
                Commence par créer une première fiche enfant.
              </p>
            </div>
            {canCreate ? (
              <Button asChild>
                <Link href="/enfants/nouveau">Créer une fiche</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {children.map((child) => (
            <Link key={child.id} href={`/enfants/${child.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                    {child.first_name.charAt(0)}
                    {child.last_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">
                        {getChildFullName(child as Child)}
                      </p>
                      <Badge variant={statusVariant(child.status as Child["status"])}>
                        {CHILD_STATUS_LABELS[child.status as Child["status"]]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getChildAge(child.birth_date)} ans
                      {child.school_name ? ` · ${child.school_name}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
