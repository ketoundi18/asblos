import {
  updateSchoolSupportFeeAction,
} from "@/lib/actions/asbl-settings";
import { BankTransferSettingsCard } from "@/components/admin/bank-transfer-settings-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatEnrollmentFeeLabel,
  getSchoolSupportFeeCents,
  type AsblSettingsSnapshot,
} from "@/lib/asbl/fee-utils";

type Props = {
  settings: AsblSettingsSnapshot;
};

export function AsblSettingsPanel({ settings }: Props) {
  const feeCents = getSchoolSupportFeeCents(settings);
  const eurosDefault = (feeCents / 100).toFixed(2);

  return (
    <div className="space-y-6">
      <BankTransferSettingsCard settings={settings} returnTo="/administration" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Cotisation soutien scolaire ({settings.school_year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSchoolSupportFeeAction} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Montant actuel : <strong>{formatEnrollmentFeeLabel(feeCents)}</strong>
              {" "}par enfant et par année — inclut le droit au soutien scolaire.
              Mets <strong>0</strong> si gratuit.
            </p>
            <div className="space-y-2">
              <Label htmlFor="school_support_fee_euros">Nouveau montant (€)</Label>
              <Input
                id="school_support_fee_euros"
                name="school_support_fee_euros"
                type="number"
                min={0}
                step={0.01}
                defaultValue={eurosDefault}
                className="max-w-xs"
              />
            </div>
            <Button type="submit" size="sm">
              Enregistrer le tarif
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
