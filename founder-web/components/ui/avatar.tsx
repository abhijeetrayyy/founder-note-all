"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ name, color, size = 40, className }: { name: string; color?: string; size?: number; className?: string }) {
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";
  return (
    <div
      className={cn("rounded-full flex items-center justify-center text-white font-extrabold shrink-0", className)}
      style={{ width: size, height: size, backgroundColor: color ?? "#5B4FE9", fontSize: size * 0.45 }}
      aria-label={name}
    >
      {initial}
    </div>
  );
}
