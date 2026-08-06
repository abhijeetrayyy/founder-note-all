"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { saveEnergyLevel } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { energyLabel, type EnergyLevelValue } from "@/lib/supabase/types";
import { ENERGY_CONFIG } from "@/lib/constants";

const options = Object.entries(ENERGY_CONFIG).map(([value, config]) => ({
  value: Number(value) as EnergyLevelValue,
  color: config.color,
  label: config.label,
}));

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
            aria-pressed={active}
            className={cn(
              "flex-1 h-12 rounded-2xl border-2 text-sm font-bold transition-all duration-200 focus-ring",
              active ? "text-white border-transparent" : "bg-base-surface border-base-border text-foreground hover:border-current",
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
  const config = ENERGY_CONFIG[value as keyof typeof ENERGY_CONFIG];
  if (!config) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 h-6 text-xs font-bold text-white"
      style={{ backgroundColor: config.color }}
    >
      {config.label} energy
    </span>
  );
}
