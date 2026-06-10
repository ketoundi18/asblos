import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EquipeMembresLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-4 w-full max-w-sm rounded bg-muted" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-36 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-11 rounded-md bg-muted" />
          <div className="h-11 rounded-md bg-muted" />
          <div className="h-10 w-40 rounded-md bg-muted" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-8 w-20 rounded-full bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
