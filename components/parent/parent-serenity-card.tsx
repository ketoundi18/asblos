import Link from "next/link";
import { CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import type { ChildSerenityView, SerenityStep, SerenityStepState } from "@/lib/parent/serenity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StepIcon({ state }: { state: SerenityStepState }) {
  if (state === "done") {
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />;
  }
  if (state === "current") {
    return <Clock className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />;
  }
  if (state === "waiting") {
    return <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />;
  }
  return <Lock className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />;
}

function StepRow({ step, isLast }: { step: SerenityStep; isLast: boolean }) {
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {!isLast ? (
        <span
          className={cn(
            "absolute left-[9px] top-6 h-[calc(100%-12px)] w-0.5",
            step.state === "done" ? "bg-green-200" : "bg-border"
          )}
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1] mt-0.5">
        <StepIcon state={step.state} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            step.state === "locked" && "text-muted-foreground",
            step.state === "done" && "text-foreground",
            step.state === "current" && "text-foreground"
          )}
        >
          {step.title}
        </p>
        <p className="text-sm text-muted-foreground leading-snug">{step.description}</p>
        {step.actionLabel && step.actionHref && step.state !== "locked" ? (
          <Button asChild size="sm" variant={step.state === "current" ? "default" : "outline"} className="mt-2">
            <Link href={step.actionHref}>{step.actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

type Props = {
  child: ChildSerenityView;
};

export function ParentSerenityCard({ child }: Props) {
  const allDone = child.steps.every((s) => s.state === "done");

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        allDone ? "border-green-200 bg-green-50/30" : "border-border"
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {child.firstName} {child.lastName}
          </h2>
          {allDone ? (
            <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              Tout est OK
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{child.reassurance}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ol className="list-none pl-0" aria-label={`Étapes pour ${child.firstName}`}>
          {child.steps.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              isLast={index === child.steps.length - 1}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
