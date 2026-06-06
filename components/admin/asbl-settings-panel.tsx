import { updateEnrollmentFeeAction } from "@/lib/actions/asbl-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEnrollmentFeeLabel, type AsblSettings } from "@/lib/data/asbl-settings";

type Props = {
  settings: AsblSettings;
};

export function AsblSettingsPanel({ settings }: Props) {
  const eurosDefault = (settings.enrollment_fee_cents / 100).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cotisation annuelle ({settings.school_year})</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateEnrollmentFeeAction} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Montant actuel :{" "}
            <strong>{formatEnrollmentFeeLabel(settings.enrollment_fee_cents)}</strong>
            {" "}— mets <strong>0</strong> si ton ASBL n&apos;a pas de cotisation.
          </p>
          <div className="space-y-2">
            <Label htmlFor="enrollment_fee_euros">Nouveau montant (€)</Label>
            <Input
              id="enrollment_fee_euros"
              name="enrollment_fee_euros"
              type="number"
              min={0}
              step={0.01}
              defaultValue={eurosDefault}
              className="max-w-xs"
            />
          </div>
          <Button type="submit" size="sm">
            Enregistrer la cotisation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
