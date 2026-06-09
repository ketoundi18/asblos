"use client";

import type { ChildWithGuardians } from "@/types/child";
import { FieldError } from "@/components/enfants/child-form/child-form-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHILD_STATUS_LABELS } from "@/lib/validations/child";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  child?: ChildWithGuardians;
  isStaff: boolean;
  fieldErrors: Record<string, string>;
};

export function ChildIdentitySection({ child, isStaff, fieldErrors }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identité</CardTitle>
        <CardDescription>Informations de base de l&apos;enfant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom *</Label>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={child?.first_name}
              required
            />
            <FieldError id="first_name-error" message={fieldErrors.first_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Nom *</Label>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={child?.last_name}
              required
            />
            <FieldError id="last_name-error" message={fieldErrors.last_name} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_date">Date de naissance *</Label>
          <Input
            id="birth_date"
            name="birth_date"
            type="date"
            defaultValue={child?.birth_date}
            required
          />
          <FieldError id="birth_date-error" message={fieldErrors.birth_date} />
        </div>
        {isStaff ? (
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <select
              id="status"
              name="status"
              defaultValue={child?.status ?? "ACTIF"}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            >
              {Object.entries(CHILD_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="status" value={child?.status ?? "ACTIF"} />
        )}
      </CardContent>
    </Card>
  );
}
