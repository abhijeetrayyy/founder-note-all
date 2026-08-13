import type { JournalEntry } from "@/lib/supabase/types";
import { daysSince } from "@/lib/loops";

/**
 * The decision log.
 *
 * Freeform journalling does not survive contact with a founder's week. Almost
 * nobody sustains it, and the entries that do get written are rarely the ones
 * anyone goes back to. What compounds — and what founders genuinely reread — is
 * a record of decisions: what you chose, what you actually knew at the time,
 * and what would make you change your mind.
 *
 * That last field is the whole point. Without it, hindsight rewrites every
 * decision as either obvious or idiotic, and you learn nothing from either. A
 * written falsification condition is the only thing that lets you tell "I was
 * wrong" apart from "I was right and got unlucky", which are the same feeling
 * and completely different lessons.
 *
 * Structure lives in the entry text rather than in new columns. It stays
 * legible if this parser is ever deleted, it exports as something a human can
 * read, and it needs no migration — the schema here is three fields and a mood.
 */

export const DECIDED = "Decided:";
export const KNEW = "Knew:";
export const UNDO = "Changes my mind:";

export interface Decision {
  decided: string;
  knew: string;
  changesMyMind: string;
}

/** Serialise a decision into the entry body. */
export function formatDecision(d: Decision): string {
  return [
    `${DECIDED} ${d.decided.trim()}`,
    d.knew.trim() ? `${KNEW} ${d.knew.trim()}` : "",
    d.changesMyMind.trim() ? `${UNDO} ${d.changesMyMind.trim()}` : "",
  ].filter(Boolean).join("\n");
}

/**
 * Read a decision back, or null when the entry is an ordinary note.
 *
 * Lenient by design: only the `Decided:` line is required, and everything after
 * a marker up to the next marker belongs to it, so a founder who pastes three
 * paragraphs under "Knew:" keeps all three.
 */
export function parseDecision(content: string): Decision | null {
  if (!content.includes(DECIDED)) return null;

  const grab = (marker: string): string => {
    const at = content.indexOf(marker);
    if (at < 0) return "";
    const rest = content.slice(at + marker.length);
    const next = [DECIDED, KNEW, UNDO]
      .filter((m) => m !== marker)
      .map((m) => rest.indexOf(m))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)[0];
    return (next === undefined ? rest : rest.slice(0, next)).trim();
  };

  const decided = grab(DECIDED);
  if (!decided) return null;
  return { decided, knew: grab(KNEW), changesMyMind: grab(UNDO) };
}

export function isDecision(entry: JournalEntry): boolean {
  return parseDecision(entry.content) !== null;
}

/** How long before a decision is worth looking at again. */
export const REVISIT_DAYS = 30;

/**
 * Whether this decision has aged into something worth rereading, and the line
 * to say about it.
 *
 * Only decisions that wrote down a falsification condition get the strong
 * prompt — those are the ones where rereading actually settles something. The
 * rest get a softer nudge, which doubles as an argument for filling the field
 * in next time.
 */
export function revisitPrompt(entry: JournalEntry, now: Date = new Date()): string | null {
  const d = parseDecision(entry.content);
  if (!d) return null;
  const age = daysSince(entry.entry_date, now);
  if (age < REVISIT_DAYS) return null;

  const weeks = Math.floor(age / 7);
  return d.changesMyMind
    ? `You made this call ${weeks} weeks ago and said you would change your mind if: ${d.changesMyMind} Has that happened?`
    : `You made this call ${weeks} weeks ago without writing down what would change your mind. Would you make it again?`;
}
