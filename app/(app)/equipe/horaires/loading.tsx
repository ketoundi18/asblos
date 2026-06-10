import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EquipeHorairesLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-8 w-52 rounded bg-muted" />
        <div className="h-4 w-full max-w-sm rounded bg-muted" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-36 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-11 rounded-md bg-muted" />
          <div className="h-11 w-56 rounded-md bg-muted" />
          <div className="h-10 w-40 rounded-md bg-muted" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-5 w-28 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-6 w-20 rounded-full bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
