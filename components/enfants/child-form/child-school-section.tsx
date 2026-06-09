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
};

export function ChildSchoolSection({ child }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scolarité</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="school_name">École</Label>
          <Input
            id="school_name"
            name="school_name"
            defaultValue={child?.school_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="school_class">Classe</Label>
          <Input
            id="school_class"
            name="school_class"
            placeholder="Ex. 3ème primaire"
            defaultValue={child?.school_class ?? ""}
          />
        </div>
      </CardContent>
    </Card>
  );
}
