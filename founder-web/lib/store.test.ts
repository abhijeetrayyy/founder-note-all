import { beforeEach, describe, expect, it } from "vitest";
import { MAX_STARS, makeNote, makeTask } from "./model";
import {
  __setForTest, capture, complete, dirtyRecords, getState, markClean, merge, pick, restore,
  sendTodos, toggleStar, undoCapture,
} from "./store";

const NOW = new Date(2026, 10, 6, 10, 0, 0);
const later = (ms: number) => new Date(NOW.getTime() + ms);
const tasks = () => Object.values(getState().db.tasks).filter((t) => !t.deleted);

beforeEach(() => __setForTest({ tasks: {}, notes: {} }));

describe("capture", () => {
  it("adds one task per line of a dump", () => {
    const r = capture("- email Priya\n- book flights tomorrow\n- ! fix checkout", NOW);
    expect(r.added.map((t) => t.title)).toEqual(["email Priya", "book flights", "fix checkout"]);
    expect(r.added[1].due).toBe("2026-11-07");
    expect(r.added[2].starred).toBe(true);
  });

  it("bumps a twin instead of duplicating it", () => {
    capture("Call accountant", NOW);
    const r = capture("call accountant!", later(1000));
    expect(r.added).toHaveLength(0);
    expect(r.bumped).toHaveLength(1);
    expect(tasks()).toHaveLength(1);
    expect(tasks()[0].bumps).toBe(1);
  });

  it("brings back something recently let go when you write it again", () => {
    const [t] = capture("renew domain", NOW).added;
    __setForTest({ tasks: { [t.id]: { ...t, status: "let-go", letGoAt: NOW.toISOString(), letGoReason: "faded" } }, notes: {} });
    const r = capture("Renew domain", later(1000));
    expect(r.bumped[0]).toMatchObject({ status: "open", letGoReason: null });
  });

  it("dedupes within a single dump", () => {
    capture("one thing\nOne thing\nanother", NOW);
    expect(tasks().map((t) => t.title).sort()).toEqual(["another", "one thing"]);
  });

  it("puts 'today' captures straight onto today", () => {
    const [t] = capture("pay rent today", NOW).added;
    expect(t.pickedFor).toBe("2026-11-06");
  });

  it("refuses a sixth star but still captures the task", () => {
    for (let i = 0; i < MAX_STARS; i++) capture(`! starred thing number ${i}`, NOW);
    const r = capture("! one more", NOW);
    expect(r.starRefused).toBe(true);
    expect(r.added[0].starred).toBe(false);
  });

  it("can be undone completely", () => {
    capture("existing task here", NOW);
    const r = capture("brand new\nexisting task here", later(1000));
    undoCapture(r, later(2000));
    expect(tasks().map((t) => [t.title, t.bumps])).toEqual([["existing task here", 0]]);
  });
});

describe("stars", () => {
  it("caps at MAX_STARS", () => {
    const ids = capture(Array.from({ length: MAX_STARS + 1 }, (_, i) => `task ${i}`).join("\n"), NOW).added.map((t) => t.id);
    for (let i = 0; i < MAX_STARS; i++) expect(toggleStar(ids[i], NOW).ok).toBe(true);
    expect(toggleStar(ids[MAX_STARS], NOW).ok).toBe(false);
    expect(toggleStar(ids[0], NOW).ok).toBe(true); // unstarring always works
    expect(toggleStar(ids[MAX_STARS], NOW).ok).toBe(true);
  });
});

describe("pick / complete / undo", () => {
  it("keeps picks in the order chosen and undo restores", () => {
    const ids = capture("a\nb\nc", NOW).added.map((t) => t.id);
    pick([ids[2], ids[0]], NOW);
    const picked = tasks().filter((t) => t.pickedFor).sort((x, y) => x.pickedAt!.localeCompare(y.pickedAt!));
    expect(picked.map((t) => t.title)).toEqual(["c", "a"]);

    const prev = complete(ids[2], later(1000));
    expect(getState().db.tasks[ids[2]].status).toBe("done");
    restore(prev, later(2000));
    expect(getState().db.tasks[ids[2]].status).toBe("open");
  });
});

describe("notes → list", () => {
  it("sends [ ] lines and marks them [>]", () => {
    const n = makeNote("Board call\n[ ] send deck to Ana\n- [ ] follow up on hiring\n[x] done already\nplain line", NOW);
    __setForTest({ tasks: {}, notes: { [n.id]: n } });
    const r = sendTodos(n.id, NOW)!;
    expect(r.added.map((t) => t.title)).toEqual(["send deck to Ana", "follow up on hiring"]);
    expect(getState().db.notes[n.id].body).toBe(
      "Board call\n[>] send deck to Ana\n- [>] follow up on hiring\n[x] done already\nplain line",
    );
    expect(sendTodos(n.id, NOW)).toBeNull();
  });
});

describe("sync merge", () => {
  it("takes newer remote copies and keeps newer local ones queued", () => {
    const t = makeTask("shared", NOW);
    __setForTest({ tasks: { [t.id]: t }, notes: {} });

    merge([{ ...t, title: "edited elsewhere", updatedAt: later(5000).toISOString() }], true);
    expect(getState().db.tasks[t.id].title).toBe("edited elsewhere");
    expect(dirtyRecords()).toHaveLength(0);

    const mine = { ...getState().db.tasks[t.id], title: "edited here", updatedAt: later(9000).toISOString() };
    __setForTest({ tasks: { [t.id]: mine }, notes: {} });
    merge([{ ...t, title: "stale remote", updatedAt: later(6000).toISOString() }], true);
    expect(getState().db.tasks[t.id].title).toBe("edited here");
    expect(dirtyRecords().map((r) => r.id)).toEqual([t.id]);
  });

  it("does not mark clean a record that changed during the push", () => {
    const [t] = capture("racing", NOW).added;
    const pushed = dirtyRecords();
    complete(t.id, later(1000));
    markClean(pushed);
    expect(dirtyRecords().map((r) => r.id)).toEqual([t.id]);
  });

  it("ignores garbage", () => {
    expect(merge([null, 42, { id: 1 }, { id: "x", kind: "nope" }], true)).toBe(0);
  });
});
