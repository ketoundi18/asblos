import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { ParentEnrollmentForm } from "@/components/parent/parent-enrollment-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default async function ParentInscrireEnfantPage() {
  const profile = await getCurrentProfile();
  const { first, last } = splitFullName(profile?.full_name ?? "");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/espace-parents">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Inscrire un enfant</h1>
        <p className="text-muted-foreground">
          Remplis la fiche de ton enfant, puis paie par Bancontact ou carte.
        </p>
      </div>

      <ParentEnrollmentForm
        guardianDefaults={{
          first_name: first,
          last_name: last,
          email: profile?.email ?? "",
          phone: profile?.phone ?? "",
        }}
      />
    </div>
  );
}
