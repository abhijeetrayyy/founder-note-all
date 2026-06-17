"use client";

import * as React from "react";
import { Card, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MODES = [
  { label: "Pomodoro", minutes: 25 },
  { label: "Deep work", minutes: 50 },
  { label: "Quick sprint", minutes: 10 },
];

export default function FocusPage() {
  const [minutes, setMinutes] = React.useState(25);
  const [secondsLeft, setSecondsLeft] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  function setMode(m: number) {
    setRunning(false);
    setMinutes(m);
    setSecondsLeft(m * 60);
  }

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const progress = minutes * 60 > 0 ? ((minutes * 60 - secondsLeft) / (minutes * 60)) * 100 : 0;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Focus Timer</h1>
        <p className="text-text-muted dark:text-dark-text-muted mt-1">Pick a mode and do one thing at a time.</p>
      </header>

      <Card className="p-8 flex flex-col items-center text-center">
        <div className="flex gap-2 mb-8">
          {MODES.map((mode) => (
            <button
              key={mode.minutes}
              onClick={() => setMode(mode.minutes)}
              className={`h-10 px-4 rounded-pill text-sm font-bold transition focus-ring ${
                minutes === mode.minutes ? "bg-primary text-white" : "bg-surface-alt dark:bg-dark-surface-alt text-text dark:text-dark-text"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="relative w-64 h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-alt dark:text-dark-surface-alt" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="text-primary transition-all"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-extrabold tabular-nums">
              {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button size="lg" onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Start focus"}
          </Button>
          <Button variant="outline" size="lg" onClick={() => setMode(minutes)}>
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
