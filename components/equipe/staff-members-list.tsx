import { toggleStaffActiveAction } from "@/lib/actions/equipe/toggle-staff-active";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { StaffMemberRow } from "@/lib/data/equipe/get-staff-members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  members: StaffMemberRow[];
  currentUserId: string;
};

export function StaffMembersList({ members, currentUserId }: Props) {
  const clockableCount = members.filter(
    (m) =>
      m.is_active &&
      (m.role === "TRAVAILLEUR" || m.role === "STAGIAIRE" || m.role === "BENEVOLE")
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Membres de l&apos;équipe</CardTitle>
        <CardDescription>
          {members.length} compte{members.length > 1 ? "s" : ""} · {clockableCount}{" "}
          peuvent pointer sur Mon service
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun membre pour l&apos;instant. Crée le premier compte ci-dessus.
          </p>
        ) : (
          <ul className="divide-y">
            {members.map((member) => {
              const toggle = toggleStaffActiveAction.bind(null, member.id);
              const isSelf = member.id === currentUserId;
              const canToggle = member.role !== "ADMIN" && !isSelf;

              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{member.full_name}</p>
                      <Badge variant="muted">{ROLE_LABELS[member.role]}</Badge>
                      {member.is_active ? (
                        <Badge variant="success">Actif</Badge>
                      ) : (
                        <Badge variant="muted">Inactif</Badge>
                      )}
                      {isSelf ? (
                        <Badge variant="default">Toi</Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>

                  {canToggle ? (
                    <form action={toggle} className="shrink-0">
                      <input
                        type="hidden"
                        name="next_active"
                        value={member.is_active ? "false" : "true"}
                      />
                      <Button
                        type="submit"
                        variant={member.is_active ? "outline" : "default"}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {member.is_active ? "Désactiver" : "Réactiver"}
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
