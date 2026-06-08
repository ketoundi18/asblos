import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { canManageActivities } from "@/lib/auth/permissions";
import { createSchoolSupportProgramAction } from "@/lib/actions/school-support";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NouveauProgrammeSoutienPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageActivities(profile.role)) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/soutien-scolaire">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Nouveau programme</h1>
        <p className="text-muted-foreground">
          Ex. « Soutien scolaire primaire » — vous ajouterez les créneaux ensuite.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSchoolSupportProgramAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input id="title" name="title" required placeholder="Soutien scolaire" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_participants">Places max (optionnel)</Label>
              <Input
                id="max_participants"
                name="max_participants"
                type="number"
                min={1}
                className="max-w-xs"
              />
            </div>
            <Button type="submit">Créer le programme</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
