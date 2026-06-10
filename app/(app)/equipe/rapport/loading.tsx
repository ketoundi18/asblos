import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EquipeRapportLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-full max-w-md rounded bg-muted" />
      </div>
      <div className="flex gap-4">
        <div className="h-11 w-40 rounded-md bg-muted" />
        <div className="h-11 w-24 rounded-md bg-muted" />
        <div className="h-11 w-32 rounded-md bg-muted" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-36 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-muted" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
