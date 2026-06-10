import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-border bg-card",
  primary: "border-primary/20 bg-primary/5",
  warning: "border-warning-border bg-warning-muted/50",
  success: "border-success-border bg-success-muted/50",
};

const valueVariants = {
  default: "text-foreground",
  primary: "text-primary",
  warning: "text-warning-foreground",
  success: "text-success-foreground",
};

type Props = {
  label: string;
  value?: string | number;
  hint?: string;
  icon?: LucideIcon;
  variant?: keyof typeof variants;
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "default",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm transition-colors",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {value !== undefined ? (
            <p
              className={cn(
                "font-heading text-3xl font-bold tabular-nums leading-none",
                valueVariants[variant]
              )}
            >
              {value}
            </p>
          ) : null}
          {hint ? (
            <p className={cn("font-heading text-base font-semibold", valueVariants[variant])}>
              {hint}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        {Icon ? (
          <Icon
            className={cn(
              "h-8 w-8 shrink-0 opacity-90",
              variant === "success" && "text-success",
              variant === "warning" && "text-warning",
              variant === "primary" && "text-primary",
              variant === "default" && "text-muted-foreground"
            )}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
