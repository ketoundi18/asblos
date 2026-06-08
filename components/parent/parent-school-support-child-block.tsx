import Link from "next/link";
import { upgradeToSchoolSupportAction } from "@/lib/actions/parent-school-support";
import { resolveSchoolSupportEnrollmentEligibility } from "@/lib/parent/school-support-eligibility";
import type { Membership } from "@/lib/data/memberships";
import { Button } from "@/components/ui/button";

type Props = {
  childId: string;
  firstName: string;
  lastName: string;
  membership: Membership | null;
  schoolSupportFeeLabel: string;
  enrollForm?: React.ReactNode;
};

export function ParentSchoolSupportChildBlock({
  childId,
  firstName,
  lastName,
  membership,
  schoolSupportFeeLabel,
  enrollForm,
}: Props) {
  const eligibility = resolveSchoolSupportEnrollmentEligibility(membership);
  const upgradeAction = upgradeToSchoolSupportAction.bind(null, childId);

  if (eligibility.allowed && enrollForm) {
    return <>{enrollForm}</>;
  }

  if (!eligibility.allowed) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
        <p className="font-medium">
          {firstName} {lastName}
        </p>
        <p className="text-sm text-muted-foreground">{eligibility.message}</p>
        {eligibility.reason === "base_plan" ? (
          <form action={upgradeAction}>
            <Button type="submit" size="sm">
              Activer le soutien scolaire
              {schoolSupportFeeLabel !== "Gratuit" ? ` (${schoolSupportFeeLabel}/an)` : ""}
            </Button>
          </form>
        ) : eligibility.actionHref && eligibility.actionLabel ? (
          <Button asChild size="sm" variant="outline">
            <Link href={eligibility.actionHref}>{eligibility.actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}
