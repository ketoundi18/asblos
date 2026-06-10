import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import { validateParentLinkAction } from "@/lib/actions/parent-admin";
import { confirmSchoolSupportMembershipAction } from "@/lib/actions/school-support-admin";
import type { CommandCenterData, CommandPriority, CommandSection, CommandItem } from "@/lib/data/command-center";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

function priorityIcon(priority: CommandPriority) {
  if (priority === "urgent") return AlertCircle;
  if (priority === "attention") return Info;
  return CheckCircle2;
}

function priorityPillVariant(priority: CommandPriority) {
  if (priority === "urgent") return "urgent" as const;
  if (priority === "attention") return "attention" as const;
  return "info" as const;
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
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium leading-tight">{item.title}</p>
          <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
        </div>
        <form action={validate} className="shrink-0">
          <input type="hidden" name="return_to" value="/" />
          <Button type="submit" size="sm" className="h-11 w-full sm:w-auto">
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
      <div className="flex flex-col gap-3 rounded-xl border border-warning-border bg-warning-muted/40 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium leading-tight">{item.title}</p>
          <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
        </div>
        <form action={confirm} className="shrink-0">
          <input type="hidden" name="return_to" value="/" />
          <Button type="submit" size="sm" className="h-11 w-full sm:w-auto">
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
      className="group flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-border bg-background/80 p-4 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="font-medium leading-tight group-hover:text-primary">{item.title}</p>
        <p className="truncate text-sm text-muted-foreground">{item.subtitle}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
        {item.actionLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

function SectionBlock({ section }: { section: CommandSection }) {
  const Icon = priorityIcon(section.priority);

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm",
        section.priority === "urgent" && "border-warning-border",
        section.priority === "info" && "border-border bg-muted/15"
      )}
    >
      <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <StatusPill variant={priorityPillVariant(section.priority)}>
              {prioritySectionLabel(section.priority)}
            </StatusPill>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  section.priority === "urgent" && "text-warning",
                  section.priority === "attention" && "text-primary",
                  section.priority === "info" && "text-muted-foreground"
                )}
                aria-hidden
              />
              {section.title}
            </CardTitle>
            <CardDescription className="text-base">{section.description}</CardDescription>
          </div>
          <StatusPill variant={priorityPillVariant(section.priority)}>
            {section.items.length}{" "}
            {section.items.length === 1 ? "dossier" : "dossiers"}
          </StatusPill>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-4">
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
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="À traiter maintenant"
          value={data.urgentCount}
          variant={data.urgentCount > 0 ? "warning" : "default"}
          icon={data.urgentCount > 0 ? AlertCircle : undefined}
        />
        <StatCard
          label="À suivre cette semaine"
          value={data.attentionCount}
          variant={data.attentionCount > 0 ? "primary" : "default"}
        />
        {data.allClear ? (
          <StatCard
            label="Votre journée"
            hint="Tout va bien"
            variant="success"
            icon={Sparkles}
          />
        ) : (
          <StatCard
            label="Sujets ouverts"
            value={actionCount}
            variant="default"
          />
        )}
      </div>

      {data.allClear ? (
        hasInfo ? (
          <div className="space-y-4">
            <EmptyState
              icon={CheckCircle2}
              variant="success"
              title="Rien d'urgent pour l'instant"
              description="Voici ce qui arrive demain — pour préparer sereinement votre journée."
            />
            {data.infoSections.map((section) => (
              <SectionBlock key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            variant="success"
            title="Belle journée — rien en attente"
            description="Revenez demain matin : ce tableau vous dira quoi traiter en un coup d'œil."
          />
        )
      ) : (
        <div className="space-y-4">
          {data.actionSections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
          {hasInfo ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pour info
              </p>
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
