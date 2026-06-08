"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AUDIT_ACTION_OPTIONS } from "@/lib/audit/audit-labels";
import type { AuditAction } from "@/lib/audit/log-audit";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const filterSchema = z.object({
  action: z.string(),
});

type FilterValues = z.infer<typeof filterSchema>;

type Props = {
  currentAction: AuditAction | null;
};

export function AuditLogFilterForm({ currentAction }: Props) {
  const router = useRouter();
  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      action: currentAction ?? "all",
    },
  });

  function onSubmit(values: FilterValues) {
    if (values.action === "all") {
      router.push("/rapports");
      return;
    }
    router.push(`/rapports?action=${encodeURIComponent(values.action)}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-2"
      >
        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem className="min-w-[220px]">
              <FormLabel className="sr-only">
                Filtrer par type d&apos;événement
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Tous les événements" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  {AUDIT_ACTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <Button type="submit" className="h-10">
          Filtrer
        </Button>
        {currentAction ? (
          <Button type="button" variant="outline" className="h-10" asChild>
            <a href="/rapports">Réinitialiser</a>
          </Button>
        ) : null}
      </form>
    </Form>
  );
}
