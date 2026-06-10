import { AsblLogo } from "@/components/ui/asbl-logo";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/** Mise en page connexion / inscription — centrée, rassurante. */
export function AuthPageShell({
  title,
  description,
  children,
  footer,
  className,
}: Props) {
  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-background p-4",
        className
      )}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AsblLogo />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-base text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {children}
        {footer ? <div>{footer}</div> : null}
      </div>
    </main>
  );
}
