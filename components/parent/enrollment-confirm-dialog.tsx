"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
  childSummary?: string;
};

export function EnrollmentConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
  childSummary,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer l&apos;inscription ?</DialogTitle>
          <DialogDescription>
            {childSummary
              ? `Vous allez enregistrer l'inscription de ${childSummary}. Vous pourrez ensuite choisir les jours de soutien et régler la cotisation si nécessaire.`
              : "Vous allez enregistrer cette inscription. Vérifiez les informations avant de continuer."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <>
                <LoadingSpinner />
                Enregistrement…
              </>
            ) : (
              "Oui, enregistrer"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Retour au formulaire
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
