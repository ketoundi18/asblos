import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { getParentSerenityDashboard } from "@/lib/data/parent-serenity";
import { ParentSerenityCard } from "@/components/parent/parent-serenity-card";
import { resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function EspaceParentsPage() {
  const profile = await getCurrentProfile();
  const { children, loadError } = await getParentSerenityDashboard();
  const parentFirstName =
    profile?.full_name?.trim().split(/\s+/)[0] ?? "à vous";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            Bonjour, {parentFirstName}.
          </p>
          <p className="text-muted-foreground">Bienvenue dans votre espace</p>
          <p className="text-sm text-muted-foreground/80">Mes enfants</p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/espace-parents/inscrire">
            <Plus className="h-4 w-4" />
            Inscrire
          </Link>
        </Button>
      </div>

      {loadError ? (
        <ServerNoticeToast flash={resolveLoadErrorToast(loadError, "parent")} />
      ) : null}

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="font-medium">Aucun enfant inscrit</p>
            <Button asChild>
              <Link href="/espace-parents/inscrire">
                <Plus className="h-4 w-4" />
                Inscrire un enfant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {children.map((child) => (
            <ParentSerenityCard key={child.childId} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}
