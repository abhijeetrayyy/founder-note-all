import { addDays, dayKey, diffDays, fromKey, type DayKey } from "./dates";

/**
 * Reading what you typed into the capture bar.
 *
 * Deliberately small. Three things are understood, and only these:
 *   - "today" (or "tonight")        → straight onto Today
 *   - a day: tomorrow, fri, next week, in 3 days, 12 nov  → a due date
 *   - a lone "!" (or a leading one)  → starred
 * Everything else is the title, word for word. A parser that guesses more than
 * this starts eating words you meant, and then you stop trusting capture.
 */

export interface Parsed {
  title: string;
  today: boolean;
  due: DayKey | null;
  starred: boolean;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};
const FULL_WEEKDAYS = new Set(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]);

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4,
  jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const PREP = String.raw`(?:(?:by|on|due|before|for|until|this)\s+)?`;

function nextWeekday(today: DayKey, wd: number, allowToday: boolean): DayKey {
  const cur = fromKey(today).getDay();
  let delta = (wd - cur + 7) % 7;
  if (delta === 0 && !allowToday) delta = 7;
  return addDays(today, delta);
}

function dateFrom(day: number, month: number, year: number | null, today: DayKey): DayKey | null {
  const t = fromKey(today);
  let y = year ?? t.getFullYear();
  let d = new Date(y, month, day);
  if (d.getMonth() !== month) return null; // 31 Feb and friends
  // No year and already passed → they mean next year.
  if (year === null && diffDays(dayKey(d), today) < 0) {
    y += 1;
    d = new Date(y, month, day);
  }
  return dayKey(d);
}

type Rule = { re: RegExp; due: (m: RegExpMatchArray, today: DayKey) => DayKey | null };

const RULES: Rule[] = [
  { re: new RegExp(String.raw`\b${PREP}(?:tomorrow|tmrw|tmr)\b`, "i"), due: (_m, t) => addDays(t, 1) },
  { re: new RegExp(String.raw`\b${PREP}next week\b`, "i"), due: (_m, t) => nextWeekday(t, 1, false) },
  { re: new RegExp(String.raw`\b${PREP}(?:the )?weekend\b`, "i"), due: (_m, t) => nextWeekday(t, 6, true) },
  {
    re: new RegExp(String.raw`\b${PREP}in (\d{1,3}) (day|days|week|weeks)\b`, "i"),
    due: (m, t) => addDays(t, Number(m[1]) * (m[2].toLowerCase().startsWith("week") ? 7 : 1)),
  },
  // "12 nov", "12th november 2027"
  {
    re: new RegExp(String.raw`\b${PREP}(\d{1,2})(?:st|nd|rd|th)? (${Object.keys(MONTHS).join("|")})\b(?:,? (\d{4}))?`, "i"),
    due: (m, t) => dateFrom(Number(m[1]), MONTHS[m[2].toLowerCase()], m[3] ? Number(m[3]) : null, t),
  },
  // "nov 12", "november 12th, 2027"
  {
    re: new RegExp(String.raw`\b${PREP}(${Object.keys(MONTHS).join("|")}) (\d{1,2})(?:st|nd|rd|th)?\b(?:,? (\d{4}))?`, "i"),
    due: (m, t) => dateFrom(Number(m[2]), MONTHS[m[1].toLowerCase()], m[3] ? Number(m[3]) : null, t),
  },
  // "next friday" — the coming one, never today.
  {
    re: new RegExp(String.raw`\b${PREP}next (${Object.keys(WEEKDAYS).join("|")})\b`, "i"),
    due: (m, t) => nextWeekday(t, WEEKDAYS[m[1].toLowerCase()], false),
  },
];

/**
 * Weekdays need more care than the rest: "sat" and "sun" are ordinary words.
 * Full names count anywhere; short forms only after "on/by/due" or as the last
 * word, which is where people actually put them ("call sam fri").
 */
function matchWeekday(text: string, today: DayKey): { start: number; end: number; due: DayKey } | null {
  const re = /\b(?:(by|on|due|before|this|until)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat)\b/gi;
  for (const m of text.matchAll(re)) {
    const word = m[2].toLowerCase();
    const atEnd = text.slice((m.index ?? 0) + m[0].length).trim() === "";
    if (FULL_WEEKDAYS.has(word) || m[1] || atEnd) {
      const start = m.index ?? 0;
      return { start, end: start + m[0].length, due: nextWeekday(today, WEEKDAYS[word], true) };
    }
  }
  return null;
}

function tidyTitle(s: string): string {
  return s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/^[\s,;:\-–—]+|[\s,;:\-–—]+$/g, "")
    .trim();
}

export function parseCapture(raw: string, today: DayKey): Parsed {
  let text = ` ${raw.trim()} `;
  let starred = false;
  let isToday = false;
  let due: DayKey | null = null;

  // Star: a standalone run of "!" anywhere, or one stuck to the front.
  if (/\s!+(?=\s)/.test(text) || /^\s!+(?=\S)/.test(text)) {
    starred = true;
    text = text.replace(/\s!+(?=\s)/g, " ").replace(/^\s!+(?=\S)/, " ");
  }

  const todayRe = /\b(?:(?:for|by|due|on)\s+)?(?:today|tonight|tonite)\b/i;
  if (todayRe.test(text)) {
    isToday = true;
    text = text.replace(todayRe, " ");
  }

  for (const rule of RULES) {
    const m = text.match(rule.re);
    if (!m || m.index === undefined) continue;
    const d = rule.due(m, today);
    if (!d) continue;
    due = d;
    text = text.slice(0, m.index) + " " + text.slice(m.index + m[0].length);
    break;
  }
  if (!due) {
    const w = matchWeekday(text, today);
    if (w) {
      due = w.due;
      text = text.slice(0, w.start) + " " + text.slice(w.end);
    }
  }

  // A due date of today is the same as "today".
  if (due === today) {
    isToday = true;
    due = null;
  }

  const title = tidyTitle(text);
  // If parsing ate the whole thing ("tomorrow"), keep what they typed.
  return { title: title || raw.trim(), today: isToday, due, starred };
}

/**
 * A brain dump: one task per line.
 *
 * Strips the bullets and checkboxes people paste in from other apps, so a list
 * copied out of Notes or a doc arrives as clean titles.
 */
export function splitDump(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/^\s*(?:[-*•·◦▪>]+|\d+[.)]|\[[ xX>]?\])\s*/, "")
        .replace(/^\[[ xX>]?\]\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

/** Lowercased, punctuation-free, single-spaced — what two captures of the same thought share. */
export function normalTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["a", "an", "the", "to", "for", "of", "and", "on", "in", "with", "my", "at"]);

/**
 * Is this the same task written again?
 *
 * Exact match after normalising, or — for titles with a few real words — the
 * same set of words in any order. Kept strict on purpose: merging two things
 * that were different is far worse than letting one duplicate through.
 */
export function sameTask(a: string, b: string): boolean {
  const na = normalTitle(a);
  const nb = normalTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const wa = new Set(na.split(" ").filter((w) => !STOP.has(w)));
  const wb = new Set(nb.split(" ").filter((w) => !STOP.has(w)));
  if (wa.size < 3 || wb.size < 3) return false;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / (wa.size + wb.size - shared) >= 0.8;
}
