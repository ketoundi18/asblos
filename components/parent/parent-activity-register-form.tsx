import Link from "next/link";
import { registerParentChildToActivityAction } from "@/lib/actions/parent-activities";
import type { ParentChildForRegistration } from "@/lib/data/parent-activities";
import { Button } from "@/components/ui/button";
import { formatActivityPrice } from "@/types/activity";

type Props = {
  activityId: string;
  priceCents: number;
  availableChildren: ParentChildForRegistration[];
};

export function ParentActivityRegisterForm({
  activityId,
  priceCents,
  availableChildren,
}: Props) {
  const isPaid = priceCents > 0;
  const action = registerParentChildToActivityAction.bind(null, activityId);

  const eligible = availableChildren.filter((c) => c.eligibility.allowed);
  const blocked = availableChildren.filter((c) => !c.eligibility.allowed);

  return (
    <div className="space-y-4">
      {isPaid ? (
        <p className="text-sm text-muted-foreground">
          Participation suggérée :{" "}
          <span className="font-medium text-foreground">
            {formatActivityPrice(priceCents)}
          </span>
          . Votre enfant peut participer — le règlement peut suivre, sans pression.
        </p>
      ) : null}

      {eligible.map((child) => (
        <form key={child.id} action={action} className="space-y-3 rounded-lg border p-4">
          <input type="hidden" name="child_id" value={child.id} />

          <p className="font-medium">
            {child.first_name} {child.last_name}
          </p>

          {isPaid ? (
            <div className="space-y-2">
              <Button
                type="submit"
                name="payment_timing"
                value="defer"
                className="w-full"
              >
                Inscrire — je réglerai plus tard
              </Button>
              <Button
                type="submit"
                name="payment_timing"
                value="now"
                variant="outline"
                className="w-full"
              >
                Inscrire et payer maintenant
              </Button>
              <p className="text-xs text-muted-foreground">
                Aucune justification demandée. L&apos;ASBL vous contactera avec bienveillance si besoin.
              </p>
            </div>
          ) : (
            <Button type="submit" className="w-full">
              Inscrire {child.first_name}
            </Button>
          )}
        </form>
      ))}

      {blocked.map((child) => {
        const block = child.eligibility;
        if (block.allowed) return null;
        return (
          <div
            key={child.id}
            className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4"
          >
            <p className="font-medium">
              {child.first_name} {child.last_name}
            </p>
            <p className="text-sm text-muted-foreground leading-snug">{block.message}</p>
            {block.actionHref && block.actionLabel ? (
              <Button asChild variant="outline" size="sm">
                <Link href={block.actionHref}>{block.actionLabel}</Link>
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
