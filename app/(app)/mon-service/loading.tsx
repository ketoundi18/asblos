import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`rounded bg-muted/70 ${className ?? ""}`} aria-hidden />;
}

export default function MonServiceLoading() {
  return (
    <div className="mx-auto min-h-[52rem] max-w-lg space-y-8" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-full max-w-sm" />
      </div>

      <Card>
        <CardHeader className="text-center">
          <SkeletonBlock className="mx-auto h-12 w-12 rounded-2xl" />
          <SkeletonBlock className="mx-auto mt-3 h-7 w-40" />
          <SkeletonBlock className="mx-auto mt-2 h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <SkeletonBlock className="h-32 rounded-2xl" />
          <SkeletonBlock className="h-[4.5rem] rounded-2xl" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-24 rounded-xl" />
        <SkeletonBlock className="h-24 rounded-xl" />
      </div>

      <SkeletonBlock className="h-28 rounded-xl" />

      <SkeletonBlock className="h-16 rounded-xl" />

      <Card>
        <CardHeader>
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="mt-2 h-4 w-44" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between gap-3">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
