"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  childName: string;
};

export function EnrollmentStepDone({ childName }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <div>
          <p className="text-lg font-semibold">Inscription enregistrée</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {childName ? (
              <>
                La fiche de <strong>{childName}</strong> est bien reçue. L&apos;ASBL validera
                le dossier sous peu.
              </>
            ) : (
              <>L&apos;ASBL validera le dossier sous peu.</>
            )}
          </p>
        </div>
        <Button asChild className="w-full max-w-sm">
          <Link href="/espace-parents">Retour — Mes enfants</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
