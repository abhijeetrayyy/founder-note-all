import Link from "next/link";
import { cn } from "@/lib/utils";
import { pressureLines, isClear, type Pressure } from "@/lib/loops";

/**
 * What replaced the momentum ring.
 *
 * The ring showed "n of n done", which goes up when you add work and so can
 * never make anyone feel better. This shows at most two sentences, each one
 * countable, attributable, and a link to the place it gets smaller.
 *
 * Deliberately not a score: there is no number here a founder cannot explain,
 * and nothing they capture today can make it worse.
 */
export function PressureReadout({ pressure, className }: { pressure: Pressure; className?: string }) {
  const lines = pressureLines(pressure).slice(0, 2);

  if (isClear(pressure)) {
    return (
      <div className={cn("mx-4 mb-3 p-3.5 rounded-xl glass-ambient", className)}>
        <p className="text-2xs uppercase tracking-[0.15em] text-foreground-subtle font-bold mb-1.5">
          Right now
        </p>
        <p className="text-sm font-semibold text-foreground">Nothing is pressing.</p>
        <p className="text-2xs text-foreground-muted mt-0.5">Everything open has an answer.</p>
      </div>
    );
  }

  return (
    <div className={cn("mx-4 mb-3 p-3.5 rounded-xl glass-ambient", className)}>
      <p className="text-2xs uppercase tracking-[0.15em] text-foreground-subtle font-bold mb-2">
        Right now
      </p>
      <div className="flex flex-col gap-1.5">
        {lines.map((line) => (
          <Link
            key={line.key}
            href={line.href}
            className="group flex items-start gap-2 -mx-1 px-1 py-0.5 rounded-lg hover:bg-white/[0.04] transition-colors focus-ring"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-[7px] w-1.5 h-1.5 rounded-full flex-none",
                line.tone === "urgent" && "bg-state-overdue",
                line.tone === "warn" && "bg-state-attention",
                line.tone === "calm" && "bg-foreground-subtle",
              )}
            />
            <span className="text-[13px] leading-snug font-medium text-foreground-muted group-hover:text-foreground transition-colors">
              {line.text}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
