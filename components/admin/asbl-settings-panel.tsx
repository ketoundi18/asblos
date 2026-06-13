import {
  updateBankTransferSettingsAction,
  updateSchoolSupportFeeAction,
} from "@/lib/actions/asbl-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatEnrollmentFeeLabel,
  getSchoolSupportFeeCents,
  isBankTransferConfigured,
  type AsblSettingsSnapshot,
} from "@/lib/asbl/fee-utils";
import { formatIbanForDisplay } from "@/lib/payments/transfer-reference";

type Props = {
  settings: AsblSettingsSnapshot;
};

export function AsblSettingsPanel({ settings }: Props) {
  const feeCents = getSchoolSupportFeeCents(settings);
  const eurosDefault = (feeCents / 100).toFixed(2);
  const bankConfigured = isBankTransferConfigured(settings);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Coordonnées bancaires (virements parents)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateBankTransferSettingsAction} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {bankConfigured ? (
                <>
                  IBAN actuel :{" "}
                  <strong>{formatIbanForDisplay(settings.bank_iban!)}</strong>
                  {settings.bank_account_holder ? (
                    <>
                      {" "}
                      — {settings.bank_account_holder}
                    </>
                  ) : null}
                </>
              ) : (
                <>Aucun IBAN configuré — les parents ne pourront pas payer par virement.</>
              )}
            </p>
            <div className="space-y-2">
              <Label htmlFor="bank_iban">IBAN</Label>
              <Input
                id="bank_iban"
                name="bank_iban"
                placeholder="BE68 5390 0754 7034"
                defaultValue={
                  settings.bank_iban ? formatIbanForDisplay(settings.bank_iban) : ""
                }
                className="max-w-md font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_holder">Titulaire du compte</Label>
              <Input
                id="bank_account_holder"
                name="bank_account_holder"
                placeholder="Nom de l'ASBL"
                defaultValue={settings.bank_account_holder ?? ""}
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_transfer_instructions">Consignes (optionnel)</Label>
              <Textarea
                id="bank_transfer_instructions"
                name="bank_transfer_instructions"
                placeholder="Ex. : délai de traitement, mention obligatoire…"
                defaultValue={settings.bank_transfer_instructions ?? ""}
                rows={3}
                className="max-w-lg"
              />
            </div>
            <Button type="submit" size="sm">
              Enregistrer les coordonnées bancaires
            </Button>
          </form>
        </CardContent>
      </Card>

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
