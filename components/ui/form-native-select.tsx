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
  /** Aucune option présélectionnée — l'utilisateur doit choisir. */
  startEmpty?: boolean;
  required?: boolean;
  disabled?: boolean;
  triggerClassName?: string;
};

/** Select shadcn compatible avec les Server Actions (hidden input pour FormData). */
export function FormNativeSelect({
  id,
  name,
  defaultValue,
  options,
  placeholder = "Choisir…",
  startEmpty = false,
  required = false,
  disabled = false,
  triggerClassName,
}: FormNativeSelectProps) {
  const [value, setValue] = useState<string | undefined>(() => {
    if (startEmpty) {
      return defaultValue?.trim() ? defaultValue : undefined;
    }
    return defaultValue ?? options[0]?.value ?? "";
  });

  return (
    <>
      <input type="hidden" name={name} value={value ?? ""} required={required} />
      <Select
        value={value}
        onValueChange={setValue}
        disabled={disabled || options.length === 0}
      >
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
