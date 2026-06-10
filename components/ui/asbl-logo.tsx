import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md";
  className?: string;
};

/** Monogramme AsblOS — en attendant le logo ASBL cliente. */
export function AsblLogo({ size = "md", className }: Props) {
  const box = size === "sm" ? "h-8 w-8 text-sm" : "h-9 w-9 text-base";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-primary font-heading font-bold text-primary-foreground shadow-sm",
        box,
        className
      )}
      aria-hidden
    >
      A
    </span>
  );
}
