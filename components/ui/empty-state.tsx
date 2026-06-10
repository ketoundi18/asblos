import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "default" | "success";
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  variant = "default",
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border px-6 py-10 text-center shadow-sm",
        variant === "success"
          ? "border-success-border bg-success-muted/30"
          : "border-border bg-card",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
          variant === "success" ? "bg-success-muted" : "bg-secondary"
        )}
      >
        <Icon
          className={cn(
            "h-7 w-7",
            variant === "success" ? "text-success" : "text-primary"
          )}
          aria-hidden
        />
      </div>
      <p className="font-heading text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
