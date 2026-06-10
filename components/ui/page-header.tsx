import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  className,
  children,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
