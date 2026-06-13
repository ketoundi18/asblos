import { updateBankTransferSettingsAction } from "@/lib/actions/asbl-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isBankTransferConfigured,
  type AsblSettingsSnapshot,
} from "@/lib/asbl/fee-utils";
import { formatIbanForDisplay } from "@/lib/payments/transfer-reference";

type Props = {
  settings: AsblSettingsSnapshot;
  returnTo?: string;
};

export function BankTransferSettingsCard({ settings, returnTo = "/paiements" }: Props) {
  const bankConfigured = isBankTransferConfigured(settings);

  return (
    <Card className={!bankConfigured ? "border-warning-border bg-warning-muted/20" : undefined}>
      <CardHeader>
        <CardTitle className="text-lg">Compte bancaire ASBL (virements)</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateBankTransferSettingsAction} className="space-y-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <p className="text-sm text-muted-foreground">
            {bankConfigured ? (
              <>
                IBAN actuel :{" "}
                <strong>{formatIbanForDisplay(settings.bank_iban!)}</strong>
                {settings.bank_account_holder ? <> — {settings.bank_account_holder}</> : null}
              </>
            ) : (
              <>
                <strong>Obligatoire</strong> — sans IBAN, les parents ne peuvent pas payer par
                virement.
              </>
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
            Enregistrer l&apos;IBAN
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
