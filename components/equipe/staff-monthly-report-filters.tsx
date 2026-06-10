"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  monthParam: string;
};

export function StaffMonthlyReportFilters({ monthParam }: Props) {
  const router = useRouter();

  return (
    <form
      className="flex flex-wrap items-end gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const month = String(formData.get("month") ?? monthParam);
        router.push(`/equipe/rapport?month=${encodeURIComponent(month)}`);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="month">Mois</Label>
        <Input
          id="month"
          name="month"
          type="month"
          defaultValue={monthParam}
          required
          className="w-auto"
        />
      </div>
      <Button type="submit">Afficher</Button>
      <Button variant="outline" asChild>
        <a href={`/api/equipe/rapport/export?month=${encodeURIComponent(monthParam)}`}>
          <Download className="mr-2 h-4 w-4" aria-hidden />
          Exporter CSV
        </a>
      </Button>
    </form>
  );
}
