"use client";

import clsx from "clsx";
import { useRef, useState } from "react";

/**
 * Swipe a row on a phone: right for one action, left for another — the same
 * gesture Mail, Things and Reminders use, so it needs no teaching beyond a
 * one-time hint. Mouse and trackpad never trigger it; desktop rows have
 * visible buttons instead.
 */

export interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  tone: "pen" | "red" | "ink";
  run: () => void;
}

const TONE: Record<SwipeAction["tone"], string> = {
  pen: "bg-pen text-card",
  red: "bg-red text-white",
  ink: "bg-ink text-card",
};

const LOCK = 10; // px of travel before deciding it's a swipe, not a scroll or tap

export function Swipe({
  left,
  right,
  children,
  className,
  surface = "bg-card",
  onSwiped,
}: {
  /** Revealed on the left as the row moves right. */
  left?: SwipeAction;
  /** Revealed on the right as the row moves left. */
  right?: SwipeAction;
  children: React.ReactNode;
  className?: string;
  /** The row's own background, so the action underneath only shows as it slides. */
  surface?: string;
  onSwiped?: () => void;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number; locked: boolean; dead: boolean } | null>(null);
  const width = useRef(320);
  const swallowClick = useRef(false);
  const armed = useRef(false);

  const threshold = () => Math.min(110, width.current * 0.32);

  function reset() {
    start.current = null;
    setDragging(false);
    setDx(0);
  }

  return (
    <div className={clsx("relative overflow-hidden", className)}>
      {dx !== 0 && (
        <div
          aria-hidden
          className={clsx(
            "absolute inset-0 flex items-center px-5 text-[14px] font-medium",
            dx > 0 ? left && TONE[left.tone] : right && TONE[right.tone],
            dx > 0 ? "justify-start" : "justify-end",
          )}
        >
          <span
            className={clsx(
              "flex items-center gap-2 transition-transform duration-150",
              Math.abs(dx) >= threshold() ? "scale-100" : "scale-90 opacity-80",
            )}
          >
            {(dx > 0 ? left : right)?.icon}
            {(dx > 0 ? left : right)?.label}
          </span>
        </div>
      )}
      <div
        style={{ transform: dx ? `translate3d(${dx}px,0,0)` : undefined, touchAction: "pan-y" }}
        className={clsx("relative", surface, !dragging && "transition-transform duration-200 ease-out")}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          width.current = e.currentTarget.getBoundingClientRect().width;
          start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, locked: false, dead: false };
          armed.current = false;
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s || s.dead || e.pointerId !== s.id) return;
          const mx = e.clientX - s.x;
          const my = e.clientY - s.y;
          if (!s.locked) {
            if (Math.abs(my) > LOCK && Math.abs(my) > Math.abs(mx)) {
              s.dead = true; // it's a scroll
              return;
            }
            if (Math.abs(mx) < LOCK) return;
            s.locked = true;
            setDragging(true);
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // No live pointer to capture (synthetic events) — the swipe still works without it.
            }
          }
          const action = mx > 0 ? left : right;
          // Resist in a direction with nothing to do.
          const next = action ? mx : mx * 0.15;
          setDx(next);
          const past = Math.abs(next) >= threshold() && !!action;
          if (past !== armed.current) {
            armed.current = past;
            if (past && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(8);
          }
        }}
        onPointerUp={(e) => {
          const s = start.current;
          if (!s || !s.locked) {
            start.current = null;
            return;
          }
          swallowClick.current = true;
          // Some browsers send no click after a drag; don't let the flag eat the next real tap.
          setTimeout(() => (swallowClick.current = false), 400);
          const action = dx > 0 ? left : right;
          if (action && Math.abs(dx) >= threshold()) {
            setDragging(false);
            setDx(dx > 0 ? width.current : -width.current);
            setTimeout(() => {
              action.run();
              onSwiped?.();
              reset();
            }, 170);
          } else {
            reset();
          }
          try {
            e.currentTarget.releasePointerCapture?.(e.pointerId);
          } catch {}
        }}
        onPointerCancel={reset}
        onClickCapture={(e) => {
          // The lift at the end of a swipe must not also count as a tap on the row.
          if (swallowClick.current) {
            swallowClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
