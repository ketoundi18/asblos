import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CHILD_STATUS_LABELS } from "@/lib/validations/child";
import {
  getChildAge,
  getChildFullName,
  type Child,
} from "@/types/child";

function statusVariant(status: Child["status"]) {
  if (status === "ACTIF") return "success" as const;
  if (status === "INACTIF") return "warning" as const;
  return "muted" as const;
}

function enrollmentLabel(child: Child) {
  if (child.created_via !== "PARENT") return null;
  if (child.enrollment_status === "EN_ATTENTE_PAIEMENT") {
    return { text: "Parent · paiement", variant: "warning" as const };
  }
  if (
    child.enrollment_status === "PAYE_EN_ATTENTE_ASBL" ||
    !child.asbl_validated_at
  ) {
    return { text: "Parent · attente ASBL", variant: "warning" as const };
  }
  return { text: "Parent", variant: "success" as const };
}

type Props = {
  items: Child[];
  fullListView: boolean;
};

export function ChildrenListTable({ items, fullListView }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Enfant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Inscription</TableHead>
            {fullListView ? <TableHead>École</TableHead> : null}
            <TableHead className="text-right">Âge</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((child) => {
            const parentBadge = enrollmentLabel(child);
            return (
              <TableRow key={child.id} className="hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/enfants/${child.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {getChildFullName(child)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(child.status)}>
                    {CHILD_STATUS_LABELS[child.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {parentBadge ? (
                    <Badge variant={parentBadge.variant}>{parentBadge.text}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Staff</span>
                  )}
                </TableCell>
                {fullListView ? (
                  <TableCell className="text-sm text-muted-foreground">
                    {child.school_name ?? "—"}
                  </TableCell>
                ) : null}
                <TableCell className="text-right text-sm text-muted-foreground">
                  {getChildAge(child.birth_date)} ans
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
