import { describe, expect, it } from "vitest";
import { FADE_DAYS, LIST_HOLDS, STALE_DAYS, makeTask, type Task } from "./model";
import { rate, shelve, tidy } from "./rank";

const TODAY = "2026-11-06";
const NOW = new Date(2026, 10, 6, 10, 0, 0);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const task = (title: string, extra: Partial<Task> = {}, created = 0) => makeTask(title, daysAgo(created), extra);

describe("rate", () => {
  it("puts a deadline today above a star", () => {
    const due = rate(task("a", { due: TODAY }, 5), TODAY, NOW);
    const star = rate(task("b", { starred: true }, 5), TODAY, NOW);
    expect(due.score).toBeGreaterThan(star.score);
    expect(due.why).toBe("Due today");
    expect(due.tone).toBe("hot");
  });

  it("puts anything overdue above a starred task due tomorrow", () => {
    const overdue = rate(task("late", { due: "2026-11-04" }, 12), TODAY, NOW);
    const soon = rate(task("soon", { due: "2026-11-07", starred: true }, 0), TODAY, NOW);
    expect(overdue.score).toBeGreaterThan(soon.score);
  });

  it("says when something keeps getting carried over", () => {
    const r = rate(task("c", { skips: 3, lastPickedFor: "2026-11-05" }, 4), TODAY, NOW);
    expect(r.why).toMatch(/Carried over 3 times/);
    const once = rate(task("c", { skips: 1, lastPickedFor: "2026-11-05" }, 4), TODAY, NOW);
    expect(once.why).toBe("Left over from yesterday");
  });

  it("counts writing something down twice", () => {
    expect(rate(task("d", { bumps: 2 }, 3), TODAY, NOW).why).toBe("You wrote this down 3 times");
    // ...even when it is brand new, which says nothing on its own.
    expect(rate(task("d2", { bumps: 1 }, 0), TODAY, NOW).why).toBe("You wrote this down 2 times");
    expect(rate(task("d3", {}, 0), TODAY, NOW).why).toBeNull();
  });

  it("calls out things nobody has touched", () => {
    const r = rate(task("e", {}, 12), TODAY, NOW);
    expect(r.why).toBe("Untouched 12 days");
    expect(r.tone).toBe("quiet");
  });

  it("decays with neglect", () => {
    expect(rate(task("f", {}, 2), TODAY, NOW).score).toBeGreaterThan(rate(task("g", {}, 20), TODAY, NOW).score);
  });
});

describe("shelve", () => {
  it("splits today, done today, list and later", () => {
    const tasks = [
      task("picked", { pickedFor: TODAY, pickedAt: NOW.toISOString() }),
      task("done", { status: "done", doneAt: NOW.toISOString() }),
      task("done last week", { status: "done", doneAt: daysAgo(7).toISOString() }),
      task("open"),
      task("snoozed", { snoozedUntil: "2026-11-20" }),
      task("far deadline", { due: "2027-01-10" }),
      task("near deadline", { due: "2026-11-10" }),
      task("let go", { status: "let-go" }),
    ];
    const s = shelve(tasks, TODAY, NOW);
    expect(s.today.map((t) => t.title)).toEqual(["picked"]);
    expect(s.doneToday.map((t) => t.title)).toEqual(["done"]);
    expect(s.ranked.map((r) => r.task.title).sort()).toEqual(["near deadline", "open"]);
    expect(s.later.map((t) => t.title)).toEqual(["snoozed", "far deadline"]);
  });

  it("holds LIST_HOLDS and fades the rest", () => {
    const tasks = Array.from({ length: LIST_HOLDS + 4 }, (_, i) => task(`t${i}`, {}, i % 10));
    const s = shelve(tasks, TODAY, NOW);
    expect(s.ranked).toHaveLength(LIST_HOLDS);
    expect(s.fading).toHaveLength(4);
    expect(s.fading.every((f) => f.because === "below-line")).toBe(true);
    // The ones that fade are the least recently touched.
    const worstKept = Math.min(...s.ranked.map((r) => r.score));
    expect(s.fading.every((f) => f.score <= worstKept)).toBe(true);
  });

  it("fades stale things even when the list is short — unless a star or date holds them up", () => {
    const s = shelve([
      task("stale", {}, STALE_DAYS),
      task("stale but starred", { starred: true }, STALE_DAYS + 5),
      task("stale but due", { due: "2026-11-12" }, STALE_DAYS + 5),
    ], TODAY, NOW);
    expect(s.fading.map((f) => f.task.title)).toEqual(["stale"]);
    expect(s.fading[0].because).toBe("stale");
  });
});

describe("tidy", () => {
  it("returns yesterday's unfinished picks to the list, counted as carried", () => {
    const t = task("unfinished", { pickedFor: "2026-11-05", pickedAt: daysAgo(1).toISOString(), lastPickedFor: "2026-11-05" }, 2);
    const [out] = tidy([t], TODAY, NOW);
    expect(out).toMatchObject({ pickedFor: null, skips: 1, lastPickedFor: "2026-11-05" });
    expect(rate(out, TODAY, NOW).why).toBe("Left over from yesterday");
  });

  it("does not touch what was finished yesterday", () => {
    const t = task("finished", { pickedFor: "2026-11-05", status: "done", doneAt: daysAgo(1).toISOString() });
    expect(tidy([t], TODAY, NOW)).toEqual([]);
  });

  it("wakes snoozes that are up", () => {
    const t = task("snoozed", { snoozedUntil: TODAY }, 10);
    const [out] = tidy([t], TODAY, NOW);
    expect(out).toMatchObject({ snoozedUntil: null, wokeOn: TODAY });
    expect(rate(out, TODAY, NOW).why).toBe("Back from snooze");
  });

  it("starts the fade, then clears to the archive FADE_DAYS later", () => {
    const stale = task("stale", {}, STALE_DAYS + 1);
    const [started] = tidy([stale], TODAY, NOW);
    expect(started.fadingSince).toBe(NOW.toISOString());
    expect(started.status).toBe("open");

    const later = new Date(NOW.getTime() + FADE_DAYS * 86_400_000);
    const laterKey = "2026-11-13";
    const [cleared] = tidy([started], laterKey, later);
    expect(cleared).toMatchObject({ status: "let-go", letGoReason: "faded", fadingSince: null });
  });

  it("stops the fade when something recovers", () => {
    const t = task("kept", { fadingSince: daysAgo(2).toISOString() }, 1);
    const [out] = tidy([t], TODAY, NOW);
    expect(out.fadingSince).toBeNull();
  });

  it("is idempotent", () => {
    const tasks = [
      ...Array.from({ length: LIST_HOLDS + 3 }, (_, i) => task(`t${i}`, {}, i % 25)),
      task("old pick", { pickedFor: "2026-11-04" }),
      task("snooze over", { snoozedUntil: "2026-11-01" }),
      task("expired", { fadingSince: daysAgo(FADE_DAYS + 1).toISOString() }, 40),
    ];
    const first = tidy(tasks, TODAY, NOW);
    expect(first.length).toBeGreaterThan(0);
    const applied = tasks.map((t) => first.find((c) => c.id === t.id) ?? t);
    expect(tidy(applied, TODAY, NOW)).toEqual([]);
  });
});
