import type { SupabaseClient } from "@supabase/supabase-js";
import { dirtyRecords, markAllDirty, markClean, merge, onLocalChange, runTidy } from "./store";

/**
 * Optional sync through Supabase, so the phone and the laptop see one list.
 *
 * The device stays the source of truth. Sync pushes what changed here, pulls
 * what changed elsewhere, and settles each record by whichever copy was edited
 * last. If the server is unreachable nothing breaks — changes queue and go up
 * the next time it can connect.
 *
 * Needs one table and one function on the Supabase side: supabase/schema.sql.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const syncAvailable = Boolean(URL && ANON);

const CURSOR_KEY = "fos.cursor";
const PAGE = 1000;
const PUSH_CHUNK = 200;

export type SyncState = "off" | "signed-out" | "syncing" | "synced" | "offline" | "error";

export interface SyncStatus {
  state: SyncState;
  email: string | null;
  lastSyncedAt: string | null;
  error: string | null;
}

let status: SyncStatus = {
  state: syncAvailable ? "signed-out" : "off",
  email: null,
  lastSyncedAt: null,
  error: null,
};
const listeners = new Set<() => void>();
export const subscribeSync = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getSync = () => status;
function set(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  for (const l of listeners) l();
}

let client: SupabaseClient | null = null;
let started = false;
let running = false;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Loaded on first use, so the Supabase library never slows down opening the app. */
async function sb(): Promise<SupabaseClient | null> {
  if (!syncAvailable) return null;
  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");
    client ??= createClient(URL, ANON, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "fos.auth", detectSessionInUrl: false },
    });
  }
  return client;
}

function explain(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (/fetch failed|Failed to fetch|NetworkError|Load failed|ENOTFOUND/i.test(msg)) {
    return "Can't reach the sync server. If you're online, the Supabase project in NEXT_PUBLIC_SUPABASE_URL may be paused or gone.";
  }
  if (/fos_records|fos_push|schema cache|does not exist/i.test(msg)) {
    return "The sync table isn't set up yet. Run supabase/schema.sql in your Supabase project's SQL editor.";
  }
  return msg;
}

export function scheduleSync(delay = 1500) {
  if (status.state === "off" || status.state === "signed-out") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delay);
}

export async function syncNow(): Promise<void> {
  const c = await sb();
  if (!c || !status.email) return;
  if (running) {
    again = true;
    return;
  }
  running = true;
  set({ state: "syncing", error: null });
  try {
    const pending = dirtyRecords();
    for (let i = 0; i < pending.length; i += PUSH_CHUNK) {
      const chunk = pending.slice(i, i + PUSH_CHUNK);
      const { error } = await c.rpc("fos_push", {
        recs: chunk.map((r) => ({ id: r.id, kind: r.kind, data: r, updated_at: r.updatedAt })),
      });
      if (error) throw error;
      markClean(chunk);
    }

    // Overlap the cursor by two minutes: a row committed a moment late is pulled
    // twice rather than never, and merging the same record twice is harmless.
    const cursor = localStorage.getItem(CURSOR_KEY);
    let since = cursor ? new Date(new Date(cursor).getTime() - 120_000).toISOString() : "1970-01-01T00:00:00Z";
    let newest = cursor;
    for (;;) {
      const { data, error } = await c
        .from("fos_records")
        .select("data, synced_at")
        .gt("synced_at", since)
        .order("synced_at", { ascending: true })
        .limit(PAGE);
      if (error) throw error;
      const rows = (data ?? []) as { data: unknown; synced_at: string }[];
      merge(rows.map((r) => r.data), true);
      if (rows.length) {
        newest = rows[rows.length - 1].synced_at;
        since = newest;
      }
      if (rows.length < PAGE) break;
    }
    if (newest) localStorage.setItem(CURSOR_KEY, newest);

    runTidy();
    set({ state: "synced", lastSyncedAt: new Date().toISOString(), error: null });
  } catch (e) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    set({ state: offline ? "offline" : "error", error: offline ? null : explain(e) });
  } finally {
    running = false;
    if (again) {
      again = false;
      scheduleSync(500);
    }
  }
}

/** Wire sync up once, on the client. Safe to call when sync is not configured. */
export async function startSync() {
  if (started || typeof window === "undefined" || !syncAvailable) return;
  started = true;
  // Only fetch the library if this device has signed in before.
  if (!localStorage.getItem("fos.auth")) {
    onLocalChange(() => scheduleSync());
    return;
  }
  const c = await sb();
  if (!c) return;
  watch(c);
}

let watching = false;

/** Follow the session and keep syncing while signed in. */
function watch(c: SupabaseClient) {
  if (watching) return;
  watching = true;
  onLocalChange(() => scheduleSync());

  c.auth.getSession().then(({ data }) => {
    const email = data.session?.user.email ?? null;
    set({ email, state: email ? "synced" : "signed-out" });
    if (email) scheduleSync(0);
  }).catch(() => set({ state: "signed-out" }));

  c.auth.onAuthStateChange((_event, session) => {
    const email = session?.user.email ?? null;
    if (email === status.email) return;
    set({ email, state: email ? "synced" : "signed-out" });
    if (email) scheduleSync(0);
  });

  window.addEventListener("online", () => scheduleSync(0));
  window.addEventListener("focus", () => scheduleSync(0));
  // Coming back to the phone app fires no "focus" — only a visibility change.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync(0);
  });
  setInterval(() => {
    if (document.visibilityState === "visible") scheduleSync(0);
  }, 60_000);
}

export async function signIn(email: string, password: string, create: boolean): Promise<string | null> {
  const c = await sb();
  if (!c) return "Sync isn't configured for this build.";
  try {
    const { data, error } = create
      ? await c.auth.signUp({ email, password })
      : await c.auth.signInWithPassword({ email, password });
    if (error) return explain(error);
    if (!data.session) return "Check your email to confirm the account, then sign in here.";
    // Everything on this device goes up on first sign-in, so nothing written
    // before sync was turned on is left behind.
    localStorage.removeItem(CURSOR_KEY);
    markAllDirty();
    set({ email: data.session.user.email ?? email, state: "synced", error: null });
    watch(c);
    await syncNow();
    return null;
  } catch (e) {
    return explain(e);
  }
}

export async function signOut() {
  const c = await sb();
  if (!c) return;
  await c.auth.signOut().catch(() => {});
  localStorage.removeItem(CURSOR_KEY);
  set({ email: null, state: "signed-out", lastSyncedAt: null, error: null });
}
