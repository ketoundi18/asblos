import Link from "next/link";
import { Plus, User } from "lucide-react";
import { getChildrenList } from "@/lib/data/children";
import { getCurrentProfile } from "@/lib/auth/session";
import { canCreateChild, canViewFullChildProfile } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChildrenListTable } from "@/components/enfants/children-list-table";
import type { Child } from "@/types/child";

export default async function EnfantsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const profile = await getCurrentProfile();
  const { children, loadError } = await getChildrenList();
  const canCreate = profile ? canCreateChild(profile.role) : false;
  const fullListView = profile ? canViewFullChildProfile(profile.role) : false;

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

      {success === "anonymized" ? (
        <div
          className="rounded-md border border-green-300/50 bg-green-50 px-4 py-3 text-sm text-green-900"
          role="status"
        >
          Fiche enfant anonymisée avec succès.
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
        <ChildrenListTable items={children as Child[]} fullListView={fullListView} />
      )}
    </div>
  );
}
