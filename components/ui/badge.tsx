import { cn } from "@/lib/utils";

const variants = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success-muted text-success-foreground",
  warning: "bg-warning-muted text-warning-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
