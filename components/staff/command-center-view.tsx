import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { validateParentLinkAction } from "@/lib/actions/parent-admin";
import { confirmSchoolSupportMembershipAction } from "@/lib/actions/school-support-admin";
import type { CommandCenterData, CommandPriority, CommandSection, CommandItem } from "@/lib/data/command-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function priorityIcon(priority: CommandPriority) {
  if (priority === "urgent") return AlertCircle;
  if (priority === "attention") return Info;
  return CheckCircle2;
}

function priorityBadge(priority: CommandPriority) {
  if (priority === "urgent") return "warning" as const;
  if (priority === "attention") return "default" as const;
  return "muted" as const;
}

function prioritySectionLabel(priority: CommandPriority) {
  if (priority === "urgent") return "À traiter maintenant";
  if (priority === "attention") return "Cette semaine";
  return "Pour info";
}

function CommandItemRow({ item }: { item: CommandItem }) {
  if (item.quickAction === "validate_parent" && item.quickActionId) {
    const validate = validateParentLinkAction.bind(null, item.quickActionId);
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium leading-tight">{item.title}</p>
          <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
        </div>
        <form action={validate} className="shrink-0">
          <Button type="submit" size="sm" className="w-full sm:w-auto">
            <CheckCircle2 className="h-4 w-4" />
            {item.actionLabel}
          </Button>
        </form>
      </div>
    );
  }

  if (item.quickAction === "confirm_school_support" && item.quickActionId) {
    const confirm = confirmSchoolSupportMembershipAction.bind(null, item.quickActionId);
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium leading-tight">{item.title}</p>
          <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
        </div>
        <form action={confirm} className="shrink-0">
          <Button type="submit" size="sm" className="w-full sm:w-auto">
            <CheckCircle2 className="h-4 w-4" />
            {item.actionLabel}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="min-w-0">
        <p className="font-medium leading-tight">{item.title}</p>
        <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
        {item.actionLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  );
}

function SectionBlock({ section }: { section: CommandSection }) {
  const Icon = priorityIcon(section.priority);

  return (
    <Card
      className={cn(
        section.priority === "urgent" && "border-amber-300",
        section.priority === "attention" && "border-border",
        section.priority === "info" && "border-border bg-muted/20"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {prioritySectionLabel(section.priority)}
            </p>
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  section.priority === "urgent" && "text-amber-600",
                  section.priority === "attention" && "text-primary",
                  section.priority === "info" && "text-muted-foreground"
                )}
                aria-hidden
              />
              {section.title}
            </CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </div>
          <Badge variant={priorityBadge(section.priority)}>{section.items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {section.items.map((item) => (
          <CommandItemRow key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}

export function CommandCenterView({ data }: { data: CommandCenterData }) {
  const hasInfo = data.infoSections.length > 0;
  const actionCount = data.actionSections.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className={data.urgentCount > 0 ? "border-amber-300 bg-amber-50/40" : ""}>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold tabular-nums">{data.urgentCount}</p>
            <p className="text-sm text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold tabular-nums">{data.attentionCount}</p>
            <p className="text-sm text-muted-foreground">À suivre</p>
          </CardContent>
        </Card>
        <Card className={data.allClear ? "border-green-300 bg-green-50/40" : ""}>
          <CardContent className="flex items-center gap-3 pt-4">
            {data.allClear ? (
              <>
                <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" aria-hidden />
                <div>
                  <p className="font-semibold text-green-800">Tout va bien</p>
                  <p className="text-sm text-green-700">Profitez de votre journée</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums">{actionCount}</p>
                <p className="text-sm text-muted-foreground">Sujets à traiter</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {data.allClear ? (
        hasInfo ? (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/30">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">Rien d&apos;urgent pour l&apos;instant</p>
                  <p className="text-sm text-muted-foreground">
                    Voici ce qui arrive demain, pour préparer votre journée.
                  </p>
                </div>
              </CardContent>
            </Card>
            {data.infoSections.map((section) => (
              <SectionBlock key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/30">
            <CardContent className="py-10 text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" aria-hidden />
              <p className="font-medium text-foreground">Belle journée — rien en attente</p>
              <p className="mt-1 text-sm">
                Revenez ici demain matin pour voir ce qui demande votre attention.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-4">
          {data.actionSections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
          {hasInfo ? (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-muted-foreground">Pour info</p>
              {data.infoSections.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
