import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-md bg-muted/70", className)}
      aria-hidden
    />
  );
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <SkeletonBar className="mb-3 h-5 w-1/3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBar key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function StaffPageLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement de la page">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBar className="h-8 w-40" />
          <SkeletonBar className="h-4 w-56" />
        </div>
        <SkeletonBar className="h-9 w-24 shrink-0 rounded-md" />
      </div>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </div>
  );
}

export function ParentPageLoadingSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Chargement de la page">
      <div className="space-y-2">
        <SkeletonBar className="h-9 w-3/4 max-w-xs" />
        <SkeletonBar className="h-4 w-48" />
        <SkeletonBar className="h-3 w-24" />
      </div>
      <SkeletonCard lines={5} />
      <SkeletonCard lines={4} />
    </div>
  );
}
