import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { getParentSerenityDashboard } from "@/lib/data/parent-serenity";
import { ParentSerenityCard } from "@/components/parent/parent-serenity-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { resolveLoadErrorToast } from "@/lib/messages/flash-messages";
import { ServerNoticeToast } from "@/components/ui/server-notice-toast";
import { Button } from "@/components/ui/button";

export default async function EspaceParentsPage() {
  const profile = await getCurrentProfile();
  const { children, loadError } = await getParentSerenityDashboard();
  const parentFirstName =
    profile?.full_name?.trim().split(/\s+/)[0] ?? "à vous";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Espace parents"
        title={`Bonjour, ${parentFirstName}`}
        description="Suivez l'avancement des inscriptions de vos enfants — une étape à la fois."
      >
        <Button asChild size="default" className="h-11 shrink-0">
          <Link href="/espace-parents/inscrire">
            <Plus className="h-4 w-4" />
            Inscrire
          </Link>
        </Button>
      </PageHeader>

      {loadError ? (
        <ServerNoticeToast flash={resolveLoadErrorToast(loadError, "parent")} />
      ) : null}

      {children.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun enfant inscrit"
          description="Commencez par inscrire votre enfant. L'ASBL validera votre dossier sous 48 h."
          action={
            <Button asChild size="lg" className="h-11">
              <Link href="/espace-parents/inscrire">
                <Plus className="h-4 w-4" />
                Inscrire un enfant
              </Link>
            </Button>
          }
        />
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
