"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

type FormNativeSelectProps = {
  id?: string;
  name: string;
  defaultValue?: string;
  options: Option[];
  placeholder?: string;
  triggerClassName?: string;
};

/** Select shadcn compatible avec les Server Actions (hidden input pour FormData). */
export function FormNativeSelect({
  id,
  name,
  defaultValue,
  options,
  placeholder = "Choisir…",
  triggerClassName,
}: FormNativeSelectProps) {
  const initial = defaultValue ?? options[0]?.value ?? "";
  const [value, setValue] = useState(initial);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger
          id={id}
          className={cn("h-11 text-base", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
