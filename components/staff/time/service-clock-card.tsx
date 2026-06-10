"use client";

import { useFormStatus } from "react-dom";
import { Play, Square, Timer } from "lucide-react";
import {
  endStaffServiceAction,
  startStaffServiceAction,
} from "@/lib/actions/staff-time";
import { formatDurationMinutes } from "@/lib/data/staff-time/format-duration";
import type { OpenServiceEntry } from "@/lib/data/staff-time/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceElapsedTimer } from "@/components/staff/time/service-elapsed-timer";
import { cn } from "@/lib/utils";

function ClockSubmitButton({
  children,
  variant,
  icon: Icon,
}: {
  children: React.ReactNode;
  variant: "default" | "destructive";
  icon: typeof Play;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className="h-[4.5rem] w-full rounded-2xl text-lg font-semibold shadow-md"
      size="lg"
    >
      <Icon className="h-7 w-7 shrink-0" aria-hidden />
      {pending ? "Enregistrement…" : children}
    </Button>
  );
}

type Props = {
  openEntry: OpenServiceEntry | null;
  todayWorkedMinutes: number;
};

export function ServiceClockCard({ openEntry, todayWorkedMinutes }: Props) {
  const isOpen = Boolean(openEntry);

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 shadow-md transition-shadow",
        isOpen
          ? "border-primary shadow-lg ring-2 ring-primary/15"
          : "border-border"
      )}
    >
      <CardHeader className="space-y-2 pb-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Timer className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <CardTitle className="font-heading text-2xl">
          {isOpen ? "En service" : "Prêt à pointer ?"}
        </CardTitle>
        <CardDescription className="text-base">
          {isOpen
            ? "Termine quand tu as fini — un seul clic."
            : "Commence ton service en un clic, même sur le terrain."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-8">
        {isOpen && openEntry ? (
          <div className="rounded-2xl bg-primary/5 px-4 py-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Temps écoulé
            </p>
            <ServiceElapsedTimer startedAt={openEntry.startedAt} />
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/60 px-4 py-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Déjà pointé aujourd&apos;hui
            </p>
            <p className="font-heading text-5xl font-bold tabular-nums tracking-tight">
              {formatDurationMinutes(todayWorkedMinutes)}
            </p>
          </div>
        )}

        {isOpen ? (
          <form action={endStaffServiceAction}>
            <ClockSubmitButton variant="destructive" icon={Square}>
              Terminer mon service
            </ClockSubmitButton>
          </form>
        ) : (
          <form action={startStaffServiceAction}>
            <ClockSubmitButton variant="default" icon={Play}>
              Commencer mon service
            </ClockSubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
