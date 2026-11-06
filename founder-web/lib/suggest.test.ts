import { describe, expect, it } from "vitest";
import { makeTask, type Task } from "./model";
import { shelve } from "./rank";
import { ASK_STALE_DAYS, looksSame, suggest } from "./suggest";

const TODAY = "2026-11-06";
const NOW = new Date(2026, 10, 6, 10, 0, 0);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const task = (title: string, extra: Partial<Task> = {}, age = 0) => makeTask(title, daysAgo(age), extra);
const ask = (tasks: Task[], skipped: Record<string, string> = {}) => suggest(shelve(tasks, TODAY, NOW), TODAY, NOW, skipped);

describe("looksSame", () => {
  it("catches the same thought with extra words", () => {
    expect(looksSame("Email Priya the contract", "email priya about the contract draft")).toBe(true);
    expect(looksSame("update investor deck", "investor deck update for Q4")).toBe(true);
  });
  it("leaves different tasks alone", () => {
    expect(looksSame("Call mum", "Call dad")).toBe(false);
    expect(looksSame("email Priya", "email Sam")).toBe(false);
    expect(looksSame("Write pricing page copy", "Write blog post on pricing")).toBe(false);
  });
});

describe("suggest", () => {
  it("asks about overdue things first", () => {
    const s = ask([
      task("stale one", {}, ASK_STALE_DAYS + 1),
      task("late one", { due: "2026-11-03" }, 5),
    ]);
    expect(s.map((x) => [x.kind, x.task.title])).toEqual([
      ["overdue", "late one"],
      ["stale", "stale one"],
    ]);
    expect(s[0].text).toBe("This was due 3 days ago. Still doing it?");
  });

  it("asks once something has been carried over three times", () => {
    expect(ask([task("slippery", { skips: 2 })])).toEqual([]);
    expect(ask([task("slippery", { skips: 3 })])[0].kind).toBe("carried");
  });

  it("pairs likely duplicates", () => {
    const [d] = ask([task("Email Priya the contract"), task("email priya about the contract draft"), task("other")]);
    expect(d.kind).toBe("duplicate");
    expect(d.other?.title).toBeDefined();
  });

  it("never asks about starred or dated things for being untouched", () => {
    expect(ask([task("starred", { starred: true }, 20), task("dated", { due: "2026-11-12" }, 20)])).toEqual([]);
  });

  it("asks one question per task", () => {
    const s = ask([task("everything wrong", { due: "2026-11-01", skips: 4 }, 30)]);
    expect(s).toHaveLength(1);
  });

  it("stays quiet about a skipped question until the skip runs out", () => {
    const t = task("late", { due: "2026-11-03" }, 5);
    const key = ask([t])[0].key;
    expect(ask([t], { [key]: "2026-11-13" })).toEqual([]);
    expect(ask([t], { [key]: "2026-11-06" })).toHaveLength(1);
  });

  it("asks again when the facts change, even if skipped", () => {
    const t = task("late", { due: "2026-11-03" }, 5);
    const key = ask([t])[0].key;
    const moved = { ...t, due: "2026-11-05" };
    expect(ask([moved], { [key]: "2026-11-13" })).toHaveLength(1);
  });
});
