"use client";

import type { OpenSchoolSupportProgram } from "@/components/enrollment/school-support-enrollment-section";
import { ParentChooseSlotsForm } from "@/components/parent/parent-choose-slots-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  childId: string;
  childName: string;
  openPrograms: OpenSchoolSupportProgram[];
  onComplete: () => void;
  onSkip: () => void;
};

export function EnrollmentStepDays({
  childId,
  childName,
  openPrograms,
  onComplete,
  onSkip,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Étape 3 — Jours de soutien (optionnel)</CardTitle>
        <CardDescription>
          Indiquez les jours qui conviennent à {childName}. Vous pouvez aussi passer cette
          étape.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ParentChooseSlotsForm
          childId={childId}
          childName={childName}
          programs={openPrograms}
          wizardMode
          onComplete={onComplete}
        />
        <Button type="button" variant="ghost" className="w-full" onClick={onSkip}>
          Passer — choisir plus tard
        </Button>
      </CardContent>
    </Card>
  );
}
