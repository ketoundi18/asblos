import Link from "next/link";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatDurationMinutes } from "@/lib/data/staff-time/format-duration";
import { formatStaffWorkDays } from "@/lib/data/staff-time/work-days";
import type { StaffContractRow } from "@/lib/data/equipe/get-staff-contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-BE", {
    timeZone: "Europe/Brussels",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

type Props = {
  contracts: StaffContractRow[];
  editingMemberId?: string | null;
};

export function StaffContractsList({ contracts, editingMemberId = null }: Props) {
  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Aucun objectif défini pour l&apos;instant.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Objectifs actifs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {contracts.map((c) => (
            <li
              key={c.id}
              className={`flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${
                editingMemberId === c.user_id ? "bg-primary/5" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{c.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[c.role]} · depuis {formatDate(c.valid_from)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Jours : {formatStaffWorkDays(c.work_days)}
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Badge variant="muted" className="tabular-nums w-fit">
                  {formatDurationMinutes(c.target_minutes)} / jour
                </Badge>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <Link href={`/equipe/horaires?edit=${c.user_id}#contract-form`}>Modifier</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
