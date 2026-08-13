"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { setPicks, quickCapture, updatePlanAction, setNotThisWeek, releaseLoop, restoreLoop, updateTask } from "@/lib/actions";
import {
  LANES, MAX_PICKS, COMMITTED_PICKS, planVerdict, capacityFit,
  type Lane, type CapacityShape,
} from "@/lib/loops";
import { energyLabel, type Task } from "@/lib/supabase/types";

/**
 * The plan board.
 *
 * One screen, everything open on it, already sorted into the four lanes — and
 * a commitment strip at the top that holds three, plus a fourth marked as a
 * stretch rather than a promise.
 *
 * The thing that makes this different from a list with checkboxes is that the
 * founder is never asked to rank anything. Ranking is the expensive part of
 * planning and the part humans are worst at when they are the ones who wrote
 * every item. So the app takes a position — this is on fire, this only feels
 * urgent — and shows its reasoning on every single row, so the position can be
 * argued with. A silent sort would just be a different list.
 */

type LaneGroup = { key: Lane; items: Task[] };
type LaneInfo = Record<string, { lane: Lane; why: string }>;

const LANE_META = Object.fromEntries(LANES.map((l) => [l.key, l])) as Record<Lane, (typeof LANES)[number]>;

const ENERGY_TONE: Record<number, string> = { 0: "#5EE0B0", 1: "#7FA6D9", 2: "#F0F0EE" };

export function PlanBoard({
  lanes, laneById, picks: initialPicks, intention: initialIntention, energy, capacity, goals,
}: {
  today: string;
  lanes: LaneGroup[];
  laneById: LaneInfo;
  picks: Task[];
  intention: string;
  energy: number;
  capacity: CapacityShape;
  goals: { id: string; title: string }[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [pickIds, setPickIds] = React.useState<string[]>(initialPicks.map((t) => t.id));
  const [intention, setIntention] = React.useState(initialIntention);
  const [swapIn, setSwapIn] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // Every task on the board, by id — the strip renders from this so a pick and
  // its row are always the same object.
  const byId = React.useMemo(() => {
    const m = new Map<string, Task>();
    for (const g of lanes) for (const t of g.items) m.set(t.id, t);
    for (const t of initialPicks) if (!m.has(t.id)) m.set(t.id, t);
    return m;
  }, [lanes, initialPicks]);

  /**
   * Resync with the server, but only when the server's selection actually
   * changed.
   *
   * Keyed on the joined ids rather than on `initialPicks`, which is a fresh
   * array on every single render — so the effect fired after every render and
   * immediately overwrote the optimistic selection with the last state the
   * server had sent. The tap still landed, but the strip flickered back to the
   * old value until `router.refresh()` returned, which reads exactly like a
   * click that did not work.
   */
  const serverPicks = initialPicks.map((t) => t.id).join(",");
  React.useEffect(() => {
    setPickIds(serverPicks ? serverPicks.split(",") : []);
  }, [serverPicks]);

  const picked = pickIds.map((id) => byId.get(id)).filter((t): t is Task => Boolean(t));
  const total = lanes.reduce((n, g) => n + g.items.length, 0);
  const fireCount = lanes.find((g) => g.key === "fire")?.items.length ?? 0;

  const verdict = planVerdict(picked, picked.map((t) => laneById[t.id]?.lane ?? "noise"), fireCount);
  const fit = capacityFit(picked, capacity);

  /** One writer for the selection, so the strip and the database never diverge. */
  async function commit(next: string[]) {
    const prev = pickIds;
    setPickIds(next);            // optimistic: a tap that waits on a round trip
    setBusy(true);               // stops feeling like a decision and starts
    const r = await setPicks(next); // feeling like paperwork.
    setBusy(false);
    if ("error" in r && r.error) { setPickIds(prev); toast.show(r.error, "error"); return; }
    router.refresh();
  }

  function onRowClick(t: Task) {
    if (pickIds.includes(t.id)) { commit(pickIds.filter((id) => id !== t.id)); return; }
    if (pickIds.length >= MAX_PICKS) {
      // Full is not an error. A founder whose day just changed needs to put the
      // new thing in and see what it costs — so the board asks what comes off
      // instead of refusing and making them go find the remove button.
      setSwapIn(t.id);
      return;
    }
    commit([...pickIds, t.id]);
  }

  function onSlotClick(slotId: string) {
    if (swapIn) {
      commit(pickIds.map((id) => (id === slotId ? swapIn : id)));
      setSwapIn(null);
      return;
    }
    commit(pickIds.filter((id) => id !== slotId));
  }

  async function saveIntention(value: string) {
    const form = new FormData();
    form.set("intention_text", value);
    form.set("mit_task_ids", pickIds.join(","));
    const r = await updatePlanAction(form);
    if (r.error) toast.show(r.error, "error");
  }

  /** Park or drop straight from the board — deciding what is NOT happening is
   *  half of planning, and making the founder leave the screen to do it is why
   *  backlogs never shrink. Both are reversible from the toast. */
  async function park(t: Task) {
    setBusy(true);
    const r = await setNotThisWeek(t.id, true, "parked while planning");
    setBusy(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show(`"${short(t.title)}" is off this week`, "success", {
      label: "Undo",
      onClick: async () => { await setNotThisWeek(t.id, false); router.refresh(); },
    });
    router.refresh();
  }

  async function drop(t: Task) {
    setBusy(true);
    const r = await releaseLoop(t.id, "dropped while planning");
    setBusy(false);
    if (r.error) { toast.show(r.error, "error"); return; }
    toast.show(`Let go of "${short(t.title)}"`, "success", {
      label: "Undo",
      onClick: async () => { await restoreLoop(t.id); router.refresh(); },
    });
    router.refresh();
  }

  const matches = (t: Task) =>
    !q.trim() || t.title.toLowerCase().includes(q.trim().toLowerCase()) ||
    t.owed_to.toLowerCase().includes(q.trim().toLowerCase());

  const left = lanes.filter((g) => g.key === "fire" || g.key === "needle");
  const right = lanes.filter((g) => g.key === "rot" || g.key === "noise");

  return (
    <div className="max-w-[1180px] mx-auto px-5 sm:px-7 pt-7 pb-16 space-y-5">
      {/* ── The commitment. The one lit surface on this screen, because it is
             the only thing here that is a decision rather than information. ── */}
      <section className="rounded-[8px] bg-[#F0F0EE] text-[#0B0B0D] p-6">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="font-mono text-2xs tracking-[0.14em] uppercase text-[#0B0B0D]/65">
            {swapIn ? "Tap the one it replaces" : "What today is for"}
          </p>
          {/* Counted against the promise, not against the slots — a fourth
              pick is a stretch and must never make the line read "4 of 3". */}
          <p className="font-mono text-2xs text-[#0B0B0D]/65">
            {Math.min(pickIds.length, COMMITTED_PICKS)} of {COMMITTED_PICKS} committed
            {pickIds.length > COMMITTED_PICKS ? " · 1 stretch" : ""}
          </p>
        </div>

        {swapIn && (
          <div className="mt-3 flex items-center gap-3 flex-wrap px-3.5 py-2.5 rounded-[6px] bg-[#0B0B0D] text-[#F0F0EE]">
            <span className="font-mono text-2xs tracking-[0.12em] uppercase text-[#FF8A4C]">Swapping in</span>
            <span className="text-base flex-1 min-w-0 truncate">{byId.get(swapIn)?.title}</span>
            <button onClick={() => setSwapIn(null)} className="text-xs text-[#9C9CA4] hover:text-[#F0F0EE] focus-ring rounded px-1">
              Cancel
            </button>
          </div>
        )}

        <ol className="mt-4 flex flex-col gap-2">
          {Array.from({ length: MAX_PICKS }, (_, i) => {
            const t = picked[i];
            const stretch = i >= COMMITTED_PICKS;
            if (!t) {
              return (
                <li key={`empty-${i}`}
                  className={cn("flex items-center gap-3.5 px-3.5 py-3 rounded-[6px] border border-dashed",
                    stretch ? "border-[#0B0B0D]/15" : "border-[#0B0B0D]/25")}>
                  <span className="font-mono text-2xs text-[#0B0B0D]/65 w-5">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-base text-[#0B0B0D]/65">
                    {stretch ? "If the day goes well — optional" : "Pick one from below"}
                  </span>
                </li>
              );
            }
            return (
              <li key={t.id}>
                <Slot task={t} index={i} why={laneById[t.id]?.why} stretch={stretch}
                  swapping={!!swapIn} busy={busy} onAct={() => onSlotClick(t.id)} />
              </li>
            );
          })}
        </ol>

        {/* The app's opinion of the plan. Silent when the plan is fine — advice
            on every single day is how advice stops being read. */}
        {verdict && (
          <p className={cn("mt-4 text-base leading-[1.5] max-w-[62ch]",
            verdict.tone === "warn" ? "text-[#8A4E12]" : "text-[#0B0B0D]/70")}>
            {verdict.text}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2.5 flex-wrap">
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            onBlur={(e) => saveIntention(e.target.value)}
            placeholder="If today only goes one way, it goes…"
            aria-label="Today's intention"
            className="flex-1 min-w-[240px] h-11 px-3.5 rounded-[6px] bg-[#0B0B0D]/[0.055] border border-[#0B0B0D]/15 text-base text-[#0B0B0D] placeholder:text-[#0B0B0D]/65 outline-none focus:border-[#0B0B0D]/40"
          />
          <Link href="/today"
            className="h-11 px-[18px] rounded-[6px] bg-[#0B0B0D] hover:bg-[#26262B] text-[#F0F0EE] text-base font-medium inline-flex items-center gap-2 transition-colors focus-ring">
            {pickIds.length ? "Start the day" : "Skip for now"} →
          </Link>
        </div>

        <p className="mt-3.5 font-mono text-2xs text-[#0B0B0D]/65">
          {fit.used.deep} deep · {fit.used.medium} medium · {fit.used.admin} admin
          {" — "}a day of yours holds {capacity.deep} deep
          {fit.advice ? ` · ${fit.advice.toLowerCase()}` : ""}
        </p>

        {/* Energy is logged, so the plan can be checked against it instead of
            against an average day. Picking two deep blocks on a day you have
            already said is an admin day is the single most common way a plan
            dies by 11am. */}
        {energy === 0 && fit.used.deep > 0 && (
          <p className="mt-2 text-xs text-[#8A4E12] leading-[1.5] max-w-[62ch]">
            You logged admin energy today, and {fit.used.deep === 1 ? "one pick is" : `${fit.used.deep} picks are`} deep work.
            Either move {fit.used.deep === 1 ? "it" : "them"} to tomorrow, or change the energy — do not just hope.
          </p>
        )}
      </section>

      {/* ── Capture, right where the gaps show up ── */}
      <CaptureRow
        onAdded={(id, pick) => {
          if (pick && pickIds.length < MAX_PICKS) commit([...pickIds, id]);
          else router.refresh();
        }}
      />

      {/* ── Everything open ── */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap pt-1">
        <h2 className="text-base font-semibold">
          Everything open · <span className="font-mono text-[#9C9CA4]">{total}</span>
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find…"
          aria-label="Filter open loops"
          className="h-9 px-3 w-[190px] rounded-[6px] bg-[#1B1B1F] border border-[#26262B] text-sm text-[#F0F0EE] placeholder:text-[#9C9CA4] outline-none focus:border-[#35353C]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">
          {left.map((g) => (
            <LaneCard key={g.key} group={g} laneById={laneById} pickIds={pickIds} swapIn={swapIn}
              matches={matches} busy={busy} onPick={onRowClick} onPark={park} onDrop={drop} />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          {right.map((g) => (
            <LaneCard key={g.key} group={g} laneById={laneById} pickIds={pickIds} swapIn={swapIn}
              matches={matches} busy={busy} onPick={onRowClick} onPark={park} onDrop={drop} quiet />
          ))}
        </div>
      </div>

      {goals.length > 0 && (
        <p className="pt-1 text-xs text-[#9C9CA4] leading-[1.6] max-w-[70ch]">
          Answering to{" "}
          {goals.slice(0, 3).map((g, i) => (
            <React.Fragment key={g.id}>
              {i > 0 && " · "}
              <Link href="/goals" className="text-[#F0F0EE] hover:underline underline-offset-2">{g.title}</Link>
            </React.Fragment>
          ))}
          . If nothing you picked serves one of these, that is worth knowing before 9am rather than on Friday.
        </p>
      )}
    </div>
  );
}

/* ── One committed slot ──
   The title, why it is here, and the first two-minute move.

   That last field is not decoration. Committing a loop to today gives it a date
   and no next step, which is exactly the shape the app flags as "no next move"
   — so planning three things used to push the pressure count UP by three, which
   is a perverse thing to do to someone who just did the right thing. Asking for
   the first move here closes that gap at the moment it opens, and it is also
   the single highest-leverage question in the product: "launch the homepage"
   never gets started, "open the doc and write three bad headlines" does. */
function Slot({
  task, index, why, stretch, swapping, busy, onAct,
}: {
  task: Task; index: number; why?: string; stretch: boolean;
  swapping: boolean; busy: boolean; onAct: () => void;
}) {
  const toast = useToast();
  const [move, setMove] = React.useState(task.first_step ?? "");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => { setMove(task.first_step ?? ""); }, [task.id, task.first_step]);

  async function save() {
    const value = move.trim();
    if (value === (task.first_step ?? "").trim()) return;
    const r = await updateTask(task.id, { first_step: value });
    if (r.error) { toast.show(r.error, "error"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className={cn("rounded-[6px] transition-colors",
      swapping ? "bg-[#0B0B0D]/10" : "bg-[#0B0B0D]/[0.055]",
      stretch && "opacity-80")}>
      <div className="flex items-center gap-3.5 px-3.5 pt-3 pb-2">
        <span className="font-mono text-2xs text-[#0B0B0D]/65 w-5 flex-none">{String(index + 1).padStart(2, "0")}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-base leading-snug truncate">{task.title}</span>
          {why && <span className="block mt-0.5 text-xs text-[#0B0B0D]/65 truncate">{why}</span>}
        </span>
        <span className="flex-none text-2xs font-medium px-2 py-1 rounded border border-[#0B0B0D]/20 text-[#0B0B0D]/70">
          {energyLabel(task.energy_level as 0 | 1 | 2)}
        </span>
        <button onClick={onAct} disabled={busy}
          aria-label={swapping ? `Replace ${task.title}` : `Remove ${task.title} from today`}
          className="flex-none font-mono text-2xs text-[#0B0B0D]/65 hover:text-[#0B0B0D] px-1.5 py-1 rounded focus-ring transition-colors">
          {swapping ? "replace" : "remove"}
        </button>
      </div>

      <div className="px-3.5 pb-3 pl-[38px] flex items-center gap-2.5">
        <input
          value={move}
          onChange={(e) => setMove(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder="First two-minute move — the bit you could start right now"
          aria-label={`First move for ${task.title}`}
          className="flex-1 min-w-0 h-9 px-2.5 rounded-[5px] bg-transparent border border-[#0B0B0D]/15 text-sm text-[#0B0B0D] placeholder:text-[#0B0B0D]/65 outline-none focus:border-[#0B0B0D]/45"
        />
        <span className={cn("font-mono text-2xs w-9 flex-none transition-opacity",
          saved ? "text-[#0B0B0D]/65 opacity-100" : "opacity-0")}>saved</span>
      </div>
    </div>
  );
}

/* ── One lane ── */
function LaneCard({
  group, laneById, pickIds, swapIn, matches, busy, onPick, onPark, onDrop, quiet,
}: {
  group: LaneGroup;
  laneById: LaneInfo;
  pickIds: string[];
  swapIn: string | null;
  matches: (t: Task) => boolean;
  busy: boolean;
  onPick: (t: Task) => void;
  onPark: (t: Task) => void;
  onDrop: (t: Task) => void;
  quiet?: boolean;
}) {
  const meta = LANE_META[group.key];
  const [expanded, setExpanded] = React.useState(false);
  const visible = group.items.filter(matches);
  // A hundred rows of noise is not "seeing everything", it is a wall. The count
  // is always honest; the rows come on demand.
  const CAP = quiet ? 6 : 12;
  const shown = expanded ? visible : visible.slice(0, CAP);

  return (
    <section className="rounded-[8px] border border-[#26262B] bg-[#141417] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#26262B]">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: meta.tone }} />
          <h3 className="text-base font-semibold">{meta.label}</h3>
          <span className="font-mono text-2xs text-[#9C9CA4]">{visible.length}</span>
        </div>
        <p className="mt-1.5 text-xs text-[#9C9CA4] leading-[1.5]">{meta.blurb}</p>
      </div>

      {shown.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[#9C9CA4]">
          {group.key === "fire" ? "Nothing is on fire. That is the good outcome, not an empty screen."
            : group.key === "needle" ? "Nothing load-bearing is open. Either you are between pushes, or the real work has not been written down."
            : group.key === "rot" ? "Nothing has been left to go stale. Everything open still has a reason."
            : "No busywork queued up. Rarer than it sounds."}
        </p>
      ) : (
        shown.map((t) => (
          <LoopRowInline key={t.id} task={t} info={laneById[t.id]} picked={pickIds.includes(t.id)}
            slot={pickIds.indexOf(t.id)} swapping={!!swapIn} busy={busy}
            onPick={onPick} onPark={onPark} onDrop={onDrop} quiet={quiet} />
        ))
      )}

      {visible.length > shown.length && (
        <button onClick={() => setExpanded(true)}
          className="w-full px-5 py-3 text-sm text-[#F0F0EE] hover:bg-[#101013] border-t border-[#26262B] transition-colors focus-ring">
          Show the other {visible.length - shown.length}
        </button>
      )}
    </section>
  );
}

/* ── One row ── */
function LoopRowInline({
  task, info, picked, slot, swapping, busy, onPick, onPark, onDrop, quiet,
}: {
  task: Task; info?: { lane: Lane; why: string }; picked: boolean; slot: number;
  swapping: boolean; busy: boolean;
  onPick: (t: Task) => void; onPark: (t: Task) => void; onDrop: (t: Task) => void; quiet?: boolean;
}) {
  return (
    <div className={cn("group flex items-center gap-3 px-5 py-3 border-b border-[#26262B] last:border-b-0 transition-colors",
      picked ? "bg-[#1B1B1F]" : "hover:bg-[#101013]")}>
      <button onClick={() => onPick(task)} disabled={busy || swapping}
        aria-pressed={picked}
        aria-label={picked ? `Remove ${task.title} from today` : `Pick ${task.title} for today`}
        className={cn("w-[22px] h-[22px] rounded-[5px] flex-none flex items-center justify-center font-mono text-2xs transition-colors focus-ring",
          picked ? "bg-[#F0F0EE] text-[#0B0B0D]" : "border border-[#3A3A41] text-transparent hover:border-[#F0F0EE] hover:text-[#9C9CA4]")}>
        {picked ? String(slot + 1).padStart(2, "0") : "+"}
      </button>

      {/* The title is a second hit target for the same action. It is hidden
          from assistive tech and skipped by the tab order so the row is one
          stop with one name, not an unlabelled button next to a labelled one. */}
      <button onClick={() => onPick(task)} disabled={busy || swapping}
        aria-hidden="true" tabIndex={-1}
        className="flex-1 min-w-0 text-left focus-ring rounded">
        <p className={cn("leading-snug truncate", quiet ? "text-sm text-[#9C9CA4]" : "text-base")}>{task.title}</p>
        {info && !quiet && <p className="mt-0.5 text-xs text-[#9C9CA4] truncate">{info.why}</p>}
      </button>

      {!quiet && (
        <span className="flex-none text-2xs font-medium px-2 py-1 rounded"
          style={{ color: ENERGY_TONE[task.energy_level] ?? "#7FA6D9", background: `${ENERGY_TONE[task.energy_level] ?? "#7FA6D9"}14` }}>
          {energyLabel(task.energy_level as 0 | 1 | 2)}
        </span>
      )}

      {/* Open / not this week / let go. Kept quiet until hover or focus so the
          board reads as a set of choices rather than a row of controls.
          "Open" matters more than it looks: without it the board was the one
          list in the app you could act on but never actually read, and a
          two-word title is often not enough to decide with. */}
      <span className="flex-none flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <Link href={`/tasks/${task.id}`}
          title="Open this loop" aria-label={`Open ${task.title}`}
          className="px-2 py-1 rounded text-2xs text-[#9C9CA4] hover:text-[#F0F0EE] hover:bg-[#1B1B1F] transition-colors focus-ring">
          Open
        </Link>
        <button onClick={() => onPark(task)} disabled={busy}
          title="Not this week" aria-label={`Park ${task.title} until next week`}
          className="px-2 py-1 rounded text-2xs text-[#9C9CA4] hover:text-[#F0F0EE] hover:bg-[#1B1B1F] transition-colors focus-ring">
          Park
        </button>
        <button onClick={() => onDrop(task)} disabled={busy}
          title="Let it go — restorable for 30 days" aria-label={`Let go of ${task.title}`}
          className="px-2 py-1 rounded text-2xs text-[#9C9CA4] hover:text-[#FF8A4C] hover:bg-[#1B1B1F] transition-colors focus-ring">
          Drop
        </button>
      </span>
    </div>
  );
}

/* ── Capture ──
   Planning is when a founder remembers the four things they never wrote down.
   Sending them to another screen to record those is how half of them are lost. */
function CaptureRow({ onAdded }: { onAdded: (id: string, pick: boolean) => void }) {
  const toast = useToast();
  const [text, setText] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function add(pick: boolean) {
    const value = text.trim();
    if (!value || pending) return;
    setPending(true);
    const form = new FormData();
    form.set("text", value);
    form.set("type", "task");
    const r = await quickCapture(form);
    setPending(false);
    if (r.error || !r.id) { toast.show(r.error ?? "Could not save that", "error"); return; }
    setText("");
    onAdded(r.id, pick);
  }

  return (
    <div className="flex gap-2.5 flex-wrap">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(e.metaKey || e.ctrlKey); } }}
        placeholder="Something you just remembered…"
        aria-label="Capture a new loop"
        className="flex-1 min-w-[220px] h-11 px-3.5 rounded-[6px] bg-[#1B1B1F] border border-[#26262B] text-base text-[#F0F0EE] placeholder:text-[#9C9CA4] outline-none focus:border-[#35353C]"
      />
      <button onClick={() => add(false)} disabled={pending || !text.trim()}
        className="h-11 px-4 rounded-[6px] border border-[#35353C] text-[#F0F0EE] text-base hover:bg-[#17171B] disabled:opacity-40 transition-colors focus-ring">
        Add
      </button>
      <button onClick={() => add(true)} disabled={pending || !text.trim()}
        className="h-11 px-4 rounded-[6px] bg-[#F0F0EE] hover:bg-[#FFFFFF] text-[#0B0B0D] text-base font-medium disabled:opacity-40 transition-colors focus-ring">
        Add &amp; pick
      </button>
    </div>
  );
}

function short(s: string) { return s.length > 42 ? `${s.slice(0, 41)}…` : s; }
