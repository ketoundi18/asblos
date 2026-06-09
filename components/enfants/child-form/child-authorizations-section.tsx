"use client";

import type { ChildWithGuardians } from "@/types/child";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function ChildAuthorizationsSection({ child, isStaff }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Autorisations parentales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            name="image_rights"
            defaultChecked={child?.image_rights}
            className="h-4 w-4"
          />
          <span className="text-sm">Droit à l&apos;image accordé</span>
        </label>
        {isStaff ? (
          <div className="space-y-2">
            <Label htmlFor="image_rights_date">Date droit à l&apos;image</Label>
            <Input
              id="image_rights_date"
              name="image_rights_date"
              type="date"
              defaultValue={child?.image_rights_date ?? ""}
            />
          </div>
        ) : null}
        <label className="flex items-center gap-3 rounded-lg border p-3">
          <input
            type="checkbox"
            name="outing_authorization"
            defaultChecked={child?.outing_authorization}
            className="h-4 w-4"
          />
          <span className="text-sm">Autorisation de sortie accordée</span>
        </label>
        {isStaff ? (
          <div className="space-y-2">
            <Label htmlFor="outing_auth_date">Date autorisation sortie</Label>
            <Input
              id="outing_auth_date"
              name="outing_auth_date"
              type="date"
              defaultValue={child?.outing_auth_date ?? ""}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
