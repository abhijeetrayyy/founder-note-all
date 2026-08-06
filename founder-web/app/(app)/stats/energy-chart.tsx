"use client";

export function EnergyChart({ levels }: { levels: number[] }) {
  return (
    <div className="flex items-end gap-2 h-32">
      {levels.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-lg bg-accent/70 hover:bg-accent transition-colors"
          style={{ height: `${((v + 1) / 3) * 100}%` }}
          title={`Energy level ${v}`}
        />
      ))}
    </div>
  );
}
