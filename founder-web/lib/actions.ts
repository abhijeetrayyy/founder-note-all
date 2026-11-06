"use client";

import { MAX_STARS } from "./model";
import * as S from "./store";
import { toast } from "./toast";

/**
 * Store actions with their feedback attached. Every one that changes where a
 * task lives says so, and offers Undo — a mis-tap should never cost anything.
 */

const undo = (prev: Parameters<typeof S.restore>[0]) => ({ label: "Undo", run: () => S.restore(prev) });

const title = (id: string) => {
  const t = S.getState().db.tasks[id]?.title ?? "";
  return t.length > 42 ? `${t.slice(0, 40)}…` : t;
};

export function done(id: string) {
  const name = title(id);
  toast(`Done: ${name}`, undo(S.complete(id)));
}

export function reopen(id: string) {
  S.reopen(id);
}

export function pick(ids: string[]) {
  if (ids.length === 0) return;
  const label = ids.length === 1 ? `On Today: ${title(ids[0])}` : `${ids.length} things on Today`;
  toast(label, undo(S.pick(ids)));
}

export function unpick(id: string) {
  toast("Back on your list", undo(S.unpick(id)));
}

export function letGo(id: string) {
  toast("Let go. It's in the archive if you need it.", undo(S.letGo(id)));
}

export function keep(id: string) {
  S.keep(id);
  toast("Kept. It's back on the list.");
}

export function snooze(id: string, until: string, label: string) {
  toast(`Snoozed till ${label}`, undo(S.snooze(id, until)));
}

export function star(id: string) {
  const r = S.toggleStar(id);
  if (!r.ok) toast(`${MAX_STARS} things are already starred. Unstar one first — if everything is starred, nothing is.`, undefined, 6000);
}

export function restoreTask(id: string) {
  S.reopen(id);
  toast("Restored to your list");
}
