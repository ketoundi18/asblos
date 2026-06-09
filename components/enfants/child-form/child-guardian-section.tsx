"use client";

import type { GuardianFieldValues } from "@/components/enfants/child-form/types";
import { FieldError } from "@/components/enfants/child-form/child-form-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GUARDIAN_RELATION_LABELS } from "@/lib/validations/child";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  variant: "staff" | "parent";
  guardian: GuardianFieldValues;
  fieldErrors: Record<string, string>;
};

export function ChildGuardianSection({ variant, guardian, fieldErrors }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parent / tuteur principal</CardTitle>
        {variant === "parent" ? (
          <CardDescription>Tes coordonnées pour cette inscription</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guardian_relation">Lien de parenté *</Label>
          <select
            id="guardian_relation"
            name="guardian_relation"
            defaultValue={guardian.relation}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          >
            {Object.entries(GUARDIAN_RELATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guardian_first_name">Prénom *</Label>
            <Input
              id="guardian_first_name"
              name="guardian_first_name"
              defaultValue={guardian.firstName}
              required
            />
            <FieldError
              id="guardian_first_name-error"
              message={fieldErrors.guardian_first_name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_last_name">Nom *</Label>
            <Input
              id="guardian_last_name"
              name="guardian_last_name"
              defaultValue={guardian.lastName}
              required
            />
            <FieldError
              id="guardian_last_name-error"
              message={fieldErrors.guardian_last_name}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guardian_phone">Téléphone *</Label>
            <Input
              id="guardian_phone"
              name="guardian_phone"
              type="tel"
              defaultValue={guardian.phone}
              required
            />
            <FieldError
              id="guardian_phone-error"
              message={fieldErrors.guardian_phone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_email">E-mail</Label>
            <Input
              id="guardian_email"
              name="guardian_email"
              type="email"
              defaultValue={guardian.email}
            />
            <FieldError
              id="guardian_email-error"
              message={fieldErrors.guardian_email}
            />
          </div>
        </div>
        <label className="flex items-center gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            name="guardian_can_pickup"
            defaultChecked={guardian.canPickup}
            className="h-4 w-4"
          />
          <span className="text-sm">Autorisé(e) à récupérer l&apos;enfant</span>
        </label>
      </CardContent>
    </Card>
  );
}
