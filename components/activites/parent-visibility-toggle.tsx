import { toggleParentRegistrationAction } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

type Props = {
  activityId: string;
  isOpen: boolean;
};

export function ParentVisibilityToggle({ activityId, isOpen }: Props) {
  const action = toggleParentRegistrationAction.bind(null, activityId);

  return (
    <Card className={isOpen ? "border-green-300 bg-green-50/30" : "border-amber-300 bg-amber-50/30"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Espace parents
        </CardTitle>
        <CardDescription>
          Les parents ne voient que les activités marquées comme visibles.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <Badge variant="success">Visible pour les parents</Badge>
          ) : (
            <Badge variant="warning">Interne ASBL — invisible côté parent</Badge>
          )}
        </div>
        <form action={action}>
          <Button type="submit" variant={isOpen ? "outline" : "default"} size="sm">
            {isOpen ? "Masquer aux parents" : "Publier aux parents"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
