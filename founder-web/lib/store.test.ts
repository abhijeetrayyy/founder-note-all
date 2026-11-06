import { beforeEach, describe, expect, it } from "vitest";
import { MAX_STARS, makeNote, makeTask } from "./model";
import {
  __setForTest, capture, complete, dirtyRecords, editTask, getState, markClean, merge, mergeTasks, pick, remove, reopen, restore,
  runTidy, sendTodos, toggleStar, undoCapture,
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

  it("brings back something that faded on its own, with its history", () => {
    const [t] = capture("learn rust basics", NOW).added;
    __setForTest({ tasks: { [t.id]: { ...t, status: "let-go", letGoAt: NOW.toISOString(), letGoReason: "faded" } }, notes: {} });
    const r = capture("Learn Rust basics", later(1000));
    expect(r.bumped[0]).toMatchObject({ id: t.id, status: "open", letGoReason: null, bumps: 1 });
  });

  it("never revives a deleted or done task — writing it again makes a new one", () => {
    const [t] = capture("renew domain", NOW).added;
    __setForTest({ tasks: { [t.id]: { ...t, status: "let-go", letGoAt: NOW.toISOString(), letGoReason: "you", skips: 4 } }, notes: {} });
    const r = capture("Renew domain", later(1000));
    expect(r.bumped).toHaveLength(0);
    expect(r.added[0]).toMatchObject({ title: "Renew domain", skips: 0, bumps: 0 });
    expect(getState().db.tasks[t.id].status).toBe("let-go");
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

describe("reopen", () => {
  it("doesn't count an old finished task as carried over", () => {
    const [t] = capture("old thing", NOW).added;
    const lastWeek = "2026-10-30";
    __setForTest({ tasks: { [t.id]: { ...t, status: "done", pickedFor: lastWeek, doneAt: NOW.toISOString() } }, notes: {} });
    reopen(t.id, NOW);
    expect(getState().db.tasks[t.id]).toMatchObject({ status: "open", pickedFor: null });
  });

  it("puts something finished today back on Today", () => {
    const [t] = capture("today thing today", NOW).added;
    complete(t.id, later(1000));
    reopen(t.id, later(2000));
    expect(getState().db.tasks[t.id].pickedFor).toBe("2026-11-06");
  });
});

describe("editing", () => {
  it("starts the carried-over count again when a stuck task is rewritten smaller", () => {
    const [t] = capture("fix flaky CI", NOW).added;
    __setForTest({ tasks: { [t.id]: { ...t, skips: 3 } }, notes: {} });
    editTask(t.id, { details: "notes only" }, later(1000));
    expect(getState().db.tasks[t.id].skips).toBe(3);
    editTask(t.id, { title: "rerun CI 5 times, note the failing test" }, later(2000));
    expect(getState().db.tasks[t.id].skips).toBe(0);
  });
});

describe("the day starts at 4am", () => {
  it("keeps a late-night pick on today's card", () => {
    const late = new Date(2026, 10, 6, 23, 50);
    const [t] = capture("finish deck", late).added;
    pick([t.id], late);
    expect(getState().db.tasks[t.id].pickedFor).toBe("2026-11-06");
    const [u] = capture("after midnight thing today", new Date(2026, 10, 7, 0, 30)).added;
    expect(u.pickedFor).toBe("2026-11-06");
    const [v] = capture("morning thing today", new Date(2026, 10, 7, 4, 30)).added;
    expect(v.pickedFor).toBe("2026-11-07");
  });
});

describe("housekeeping and sync", () => {
  it("is never synced as an edit, so it can't undo what another device did", () => {
    const [t] = capture("picked yesterday", new Date(2026, 10, 5, 9)).added;
    pick([t.id], new Date(2026, 10, 5, 9));
    const before = getState().db.tasks[t.id];
    // Laptop opens the next morning and rolls yesterday's pick back to the list…
    runTidy(new Date(2026, 10, 6, 10));
    const rolled = getState().db.tasks[t.id];
    expect(rolled).toMatchObject({ pickedFor: null, skips: 1, updatedAt: before.updatedAt });
    expect(dirtyRecords().every((r) => r.updatedAt <= before.updatedAt)).toBe(true);
    // …then pulls the phone's change from 9am today: done wins.
    merge([{ ...before, status: "done", doneAt: new Date(2026, 10, 6, 9).toISOString(), updatedAt: new Date(2026, 10, 6, 9).toISOString() }], true);
    expect(getState().db.tasks[t.id].status).toBe("done");
  });
});

describe("delete and merge", () => {
  it("deletes softly, and undo brings it back exactly", () => {
    const [t] = capture("draft memo", NOW).added;
    pick([t.id], NOW);
    const prev = remove(t.id, later(1000));
    expect(getState().db.tasks[t.id]).toMatchObject({ status: "let-go", letGoReason: "you", pickedFor: null });
    restore(prev, later(2000));
    expect(getState().db.tasks[t.id]).toMatchObject({ status: "open", pickedFor: "2026-11-06" });
  });

  it("merges a duplicate without losing anything written on either", () => {
    const [a, b] = capture("Email Priya the contract\nemail priya about the contract draft", NOW).added;
    __setForTest({
      tasks: {
        [a.id]: { ...a, details: "she wants v2", due: "2026-11-12" },
        [b.id]: { ...b, details: "attach redlines", due: "2026-11-09", starred: true, bumps: 1 },
      },
      notes: {},
    });
    const prev = mergeTasks(a.id, b.id, later(1000));
    const kept = getState().db.tasks[a.id];
    expect(kept).toMatchObject({ due: "2026-11-09", starred: true, bumps: 2 });
    expect(kept.details).toBe("she wants v2\n\nattach redlines\n\nAlso written as: email priya about the contract draft");
    expect(getState().db.tasks[b.id].deleted).toBe(true);
    restore(prev, later(2000));
    expect(getState().db.tasks[b.id].deleted).toBe(false);
    expect(getState().db.tasks[a.id].bumps).toBe(0);
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
