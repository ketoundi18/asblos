"use client";

import { useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { anonymizeChildAction } from "@/lib/actions/child-gdpr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  childId: string;
  childLabel: string;
  alreadyAnonymized: boolean;
};

export function ChildGdprPanel({
  childId,
  childLabel,
  alreadyAnonymized,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const anonymize = anonymizeChildAction.bind(null, childId);

  return (
    <Card className="border-amber-200/80 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldAlert className="h-5 w-5 text-amber-700" />
          Données personnelles (RGPD)
        </CardTitle>
        <CardDescription>
          Export pour droit d&apos;accès · Anonymisation pour effacement (admin
          uniquement).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild variant="outline">
          <a href={`/api/enfants/${childId}/export`} download>
            <Download className="h-4 w-4" />
            Exporter en JSON
          </a>
        </Button>

        {alreadyAnonymized ? (
          <p className="text-sm text-muted-foreground">
            Cette fiche a déjà été anonymisée.
          </p>
        ) : (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              Anonymiser la fiche
            </Button>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Anonymiser {childLabel} ?</DialogTitle>
                  <DialogDescription>
                    Action irréversible : prénom, nom, contacts, santé et notes
                    seront effacés. La fiche sera archivée. Exportez d&apos;abord
                    les données si nécessaire.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <form action={anonymize} className="w-full">
                    <Button type="submit" variant="destructive" className="w-full">
                      Oui, anonymiser définitivement
                    </Button>
                  </form>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Annuler
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
