"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { saveEnergyLevel } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { energyLabel, type EnergyLevelValue } from "@/lib/supabase/types";

const options: { value: EnergyLevelValue; color: string; label: string }[] = [
  { value: 0, color: "#14B8A6", label: "Admin" },
  { value: 1, color: "#3B82F6", label: "Medium" },
  { value: 2, color: "#7C3AED", label: "Deep" },
];

export function EnergyPicker({ value }: { value?: number | null }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = React.useState(false);

  async function onSelect(level: EnergyLevelValue) {
    if (pending) return;
    setPending(true);
    const result = await saveEnergyLevel(level);
    setPending(false);
    if (result.error) toast.show(result.error, "error");
    else router.refresh();
  }

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            disabled={pending}
            className={cn(
              "flex-1 h-12 rounded-2xl border-2 text-sm font-bold transition focus-ring",
              active ? "text-white border-transparent" : "bg-surface dark:bg-dark-surface border-border dark:border-dark-border text-text dark:text-dark-text hover:border-current",
            )}
            style={active ? { backgroundColor: opt.color, borderColor: opt.color } : { color: opt.color }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function EnergyBadge({ value }: { value?: number | null }) {
  if (value == null) return null;
  const label = energyLabel(value as EnergyLevelValue);
  const color = ["#14B8A6", "#3B82F6", "#7C3AED"][value];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 h-6 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {label} energy
    </span>
  );
}
