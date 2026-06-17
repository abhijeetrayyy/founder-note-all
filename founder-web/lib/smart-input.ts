/**
 * Smart NLP parser for natural-language capture.
 * Detects dates, times, priority, energy, recurrence, MIT, projects, tags
 * from a freeform string. Used by the Quick Add bar everywhere.
 */
export interface SmartInput {
  original: string;
  cleanedTitle: string;
  date: Date | null;
  time: { hour: number; minute: number; label: string } | null;
  priority: 0 | 1 | 2 | null;
  energy: 0 | 1 | 2 | null;
  recurrence: 0 | 1 | 2 | 3 | null;
  isMIT: boolean;
  projectHint: string | null;
  tags: string[];
  isTask: boolean;
}

const EMPTY: SmartInput = {
  original: "",
  cleanedTitle: "",
  date: null,
  time: null,
  priority: null,
  energy: null,
  recurrence: null,
  isMIT: false,
  projectHint: null,
  tags: [],
  isTask: false,
};

function fmtDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (d2.getTime() === t.getTime()) return "Today";
  if (d2.getTime() === t.getTime() + 86400000) return "Tomorrow";
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function monthIndex(m: string): number {
  return ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(
    m.substring(0, 3).toLowerCase(),
  ) + 1;
}

function looksLikeTask(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.startsWith("/task") || lower.startsWith("/mit")) return true;
  if (lower.startsWith("/note") || lower.startsWith("/idea")) return false;
  if (
    /^(buy|call|email|send|fix|write|review|ship|build|finish|complete|schedule|reply|book|reserve|pay|submit|prepare|draft|update|clean|organize|talk|meet|investigate|research|read|learn|practice|design|plan|create|make|tidy|sort|push|deploy|merge|test|verify|check|order|return|confirm|contact|reach out|follow up|setup|set up|clean up|clear|triage|prioritize|respond|audit|update)\b/.test(
      lower,
    )
  )
    return true;
  if (text.endsWith("!") || text.endsWith("?")) return true;
  if (lower.includes(" by ") || lower.includes(" tomorrow") || lower.includes(" today")) return true;
  return false;
}

function parseDate(text: string): Date | null {
  const lower = text.toLowerCase();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (/\btoday\b/.test(lower) || /\btonight\b/.test(lower) || /\btonite\b/.test(lower)) return today;
  if (/\btomorrow\b/.test(lower)) return new Date(today.getTime() + 86400000);

  const inDays = /\bin (\d+) days?\b/.exec(lower);
  if (inDays) return new Date(today.getTime() + parseInt(inDays[1], 10) * 86400000);

  const inWeeks = /\bin (\d+) weeks?\b/.exec(lower);
  if (inWeeks) return new Date(today.getTime() + parseInt(inWeeks[1], 10) * 7 * 86400000);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  for (let i = 0; i < days.length; i++) {
    const re = new RegExp(`\\b(next|this)?\\s*${days[i]}\\b`, "i");
    const m = re.exec(lower);
    if (m) {
      const isNext = m[1] === "next";
      let target = i - ((today.getDay() + 6) % 7) + 1;
      if (target <= 0 || isNext) target = (i - ((today.getDay() + 6) % 7) + 1) + (isNext ? 7 : 7);
      return new Date(today.getTime() + target * 86400000);
    }
  }
  if (/\bnext week\b/.test(lower)) return new Date(today.getTime() + 7 * 86400000);

  const monthMatch = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})\b/i.exec(lower);
  if (monthMatch) {
    const m = monthIndex(monthMatch[1]);
    const d = parseInt(monthMatch[2], 10);
    let year = now.getFullYear();
    if (m < now.getMonth() + 1 || (m === now.getMonth() + 1 && d < now.getDate())) year += 1;
    return new Date(year, m - 1, d);
  }

  const slash = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(text);
  if (slash) {
    const m = parseInt(slash[1], 10);
    const d = parseInt(slash[2], 10);
    let y = now.getFullYear();
    if (slash[3]) {
      y = parseInt(slash[3], 10);
      if (y < 100) y += 2000;
    }
    return new Date(y, m - 1, d);
  }
  return null;
}

function parseTime(text: string): { hour: number; minute: number; label: string } | null {
  const lower = text.toLowerCase();
  if (/\b(morning|am)\b/.test(lower)) return { hour: 9, minute: 0, label: "Morning" };
  if (/\b(afternoon|noon)\b/.test(lower)) return { hour: 13, minute: 0, label: "Afternoon" };
  if (/\b(evening|tonight|pm)\b/.test(lower)) return { hour: 18, minute: 0, label: "Evening" };

  const m = /\bat (\d{1,2})(?::(\d{2}))?\s?(am|pm)?\b/i.exec(lower);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ampm = m[3]?.toLowerCase();
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return { hour: h, minute: min, label: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}` };
  }
  return null;
}

function parsePriority(text: string): 0 | 1 | 2 | null {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|critical|important|!!!)\b/.test(lower)) return 2;
  if (/\b(high priority|!)\b/.test(lower)) return 2;
  if (/\b(low priority)\b/.test(lower)) return 0;
  return null;
}

function parseEnergy(text: string): 0 | 1 | 2 | null {
  const lower = text.toLowerCase();
  if (/\b(deep work|deep focus|focus work)\b/.test(lower)) return 2;
  if (/\b(admin task|admin|quick win|quick)\b/.test(lower)) return 0;
  if (/\b(medium|medium focus)\b/.test(lower)) return 1;
  return null;
}

function parseRecurrence(text: string): 0 | 1 | 2 | 3 | null {
  const lower = text.toLowerCase();
  if (/\bevery day\b|\bdaily\b/.test(lower)) return 1;
  if (/\bevery week\b|\bweekly\b/.test(lower)) return 2;
  if (/\bevery month\b|\bmonthly\b/.test(lower)) return 3;
  return null;
}

function parseMIT(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.startsWith("/mit")) return true;
  if (/\b(most important|key task|mit)\b/.test(lower)) return true;
  return false;
}

function parseProject(text: string): string | null {
  const m = /\b(?:in|for|@)([A-Z][\w-]+|\w[\w-]+)\b/.exec(text);
  return m?.[1] ?? null;
}

function parseTags(text: string): string[] {
  const out: string[] = [];
  const re = /#([\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

export function parseSmartInput(text: string): SmartInput {
  if (!text.trim()) return { ...EMPTY };
  let remaining = text.trim();
  const date = parseDate(remaining);
  const time = parseTime(remaining);
  const priority = parsePriority(remaining);
  const energy = parseEnergy(remaining);
  const recurrence = parseRecurrence(remaining);
  const isMIT = parseMIT(remaining);
  const projectHint = parseProject(remaining);
  const tags = parseTags(remaining);

  const stripRe = [
    /\b(today|tomorrow|tonight|tonite)\b/gi,
    /\bat \d{1,2}(:\d{2})?(\s?(am|pm))?\b/gi,
    /\b(morning|afternoon|evening|noon|midnight)\b/gi,
    /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)\b/gi,
    /\b(in \d+\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)\b)/gi,
    /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}\b/gi,
    /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g,
    /\b(urgent|asap|important|critical|low priority|high priority|deep work|deep focus|admin task|quick)\b/gi,
    /\b(every|daily|weekly|monthly|recurring)\b/gi,
    /\b(most important|mit|key task)\b/gi,
    /#[\w-]+/g,
  ];
  for (const re of stripRe) remaining = remaining.replace(re, "").trim();
  remaining = remaining.replace(/\s+/g, " ").trim();
  if (remaining.toLowerCase().startsWith("to ")) remaining = remaining.slice(3);

  return {
    original: text,
    cleanedTitle: remaining || text,
    date,
    time,
    priority,
    energy,
    recurrence,
    isMIT,
    projectHint,
    tags,
    isTask: looksLikeTask(text),
  };
}

export function summary(p: SmartInput): string {
  const parts: string[] = [];
  if (p.isMIT) parts.push("MIT");
  if (p.date) parts.push(fmtDate(p.date));
  if (p.time) parts.push(`at ${p.time.label}`);
  if (p.priority != null && p.priority > 0) parts.push(["Low", "Medium", "High"][p.priority]);
  if (p.energy != null) parts.push(["Admin", "Medium", "Deep"][p.energy]);
  if (p.recurrence != null && p.recurrence > 0) parts.push(["None", "Daily", "Weekly", "Monthly"][p.recurrence]);
  if (p.projectHint) parts.push(`→ ${p.projectHint}`);
  return parts.length ? parts.join(" · ") : "Quick capture";
}
