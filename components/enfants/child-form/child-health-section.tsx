"use client";

import type { ChildWithGuardians } from "@/types/child";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  child?: ChildWithGuardians;
  isStaff: boolean;
};

export function ChildHealthSection({ child, isStaff }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Santé &amp; sécurité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea
            id="allergies"
            name="allergies"
            placeholder="Ex. arachides, latex…"
            defaultValue={child?.allergies ?? ""}
          />
        </div>
        {isStaff ? (
          <div className="space-y-2">
            <Label htmlFor="medical_notes">Notes médicales (interne)</Label>
            <Textarea
              id="medical_notes"
              name="medical_notes"
              defaultValue={child?.medical_notes ?? ""}
            />
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Contact d&apos;urgence</Label>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={child?.emergency_contact_name ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Téléphone urgence</Label>
            <Input
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              type="tel"
              defaultValue={child?.emergency_contact_phone ?? ""}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
