import { BookOpen } from "lucide-react";
import { getChildSchoolSupportStaffContext } from "@/lib/data/child-school-support-staff";
import { ChildSchoolSupportStaffForm } from "@/components/enfants/child-school-support-staff-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  childId: string;
};

export async function ChildSchoolSupportStaffPanel({ childId }: Props) {
  const context = await getChildSchoolSupportStaffContext(childId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          Soutien scolaire
        </CardTitle>
        <CardDescription>
          Inscrire, modifier les créneaux ou valider l&apos;inscription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {context.loadError ? (
          <p className="text-sm text-amber-800">{context.loadError}</p>
        ) : (
          <ChildSchoolSupportStaffForm childId={childId} context={context} />
        )}
      </CardContent>
    </Card>
  );
}
