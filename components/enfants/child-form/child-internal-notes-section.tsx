"use client";

import type { ChildWithGuardians } from "@/types/child";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  child?: ChildWithGuardians;
};

export function ChildInternalNotesSection({ child }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes internes</CardTitle>
        <CardDescription>Visible uniquement par l&apos;équipe</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea id="notes" name="notes" defaultValue={child?.notes ?? ""} />
      </CardContent>
    </Card>
  );
}
