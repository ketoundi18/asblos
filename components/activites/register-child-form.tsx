import { registerChildAction } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RegisterChildFormProps = {
  activityId: string;
  availableChildren: { id: string; first_name: string; last_name: string }[];
};

export function RegisterChildForm({
  activityId,
  availableChildren,
}: RegisterChildFormProps) {
  if (availableChildren.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inscrire un enfant</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tous les enfants actifs sont déjà inscrits, ou aucun enfant disponible.
        </CardContent>
      </Card>
    );
  }

  const action = registerChildAction.bind(null, activityId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrire un enfant</CardTitle>
        <CardDescription>Ajoute un participant à cette activité</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="child_id">Enfant</Label>
            <select
              id="child_id"
              name="child_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Choisir…</option>
              {availableChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="sm:self-end">
            Inscrire
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
