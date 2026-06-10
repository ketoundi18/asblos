import { cn } from "@/lib/utils";

const variants = {
  urgent: "bg-warning-muted text-warning-foreground ring-1 ring-warning-border",
  attention: "bg-primary/10 text-primary ring-1 ring-primary/20",
  info: "bg-muted text-muted-foreground ring-1 ring-border",
  success: "bg-success-muted text-success-foreground ring-1 ring-success-border",
  default: "bg-secondary text-secondary-foreground ring-1 ring-border",
};

type Props = {
  variant?: keyof typeof variants;
  count?: number;
  children: React.ReactNode;
  className?: string;
};

export function StatusPill({
  variant = "default",
  count,
  children,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
      {count !== undefined ? (
        <span className="tabular-nums opacity-90">· {count}</span>
      ) : null}
    </span>
  );
}
