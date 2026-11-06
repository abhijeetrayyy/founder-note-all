"use client";

import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ago, dayKey, shortDay } from "@/lib/dates";
import { useNotes, useNow, useToday } from "@/lib/hooks";
import { noteTitle, notePreview, type Note } from "@/lib/model";
import { createNote, deleteNote, editNote, getState, openTodos, restore, sendTodos, togglePin, undoCapture } from "@/lib/store";
import { toast } from "@/lib/toast";
import { ChevronLeft, Pin, Plus, Search, Send, Trash } from "@/components/icons";
import { Swipe } from "@/components/swipe";

const PLACEHOLDER = `Start writing — the first line is the title.

Lines like this one can go to your task list:
[ ] email Ana the board deck`;

function Editor({ note, onBack }: { note: Note; onBack: () => void }) {
  const now = useNow();
  const ref = useRef<HTMLTextAreaElement>(null);
  const todos = openTodos(note.body);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 420)}px`;
  }, [note.body]);

  useEffect(() => {
    if (!note.body) ref.current?.focus();
    // Only on opening a note, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  function send() {
    const res = sendTodos(note.id);
    if (!res) return;
    const n = res.added.length + res.bumped.length;
    toast(`Sent ${n} to your list${res.bumped.length ? ` (${res.bumped.length} already there)` : ""}`, {
      label: "Undo",
      run: () => undoCapture(res),
    });
  }

  function remove() {
    const prev = deleteNote(note.id);
    onBack();
    if (note.body.trim()) toast("Note deleted", { label: "Undo", run: () => restore(prev) });
  }

  return (
    <div className="animate-rise">
      <div className="mb-3 flex items-center gap-1">
        <button type="button" onClick={onBack} className="btn-quiet -ml-2 px-2 md:hidden">
          <ChevronLeft className="h-4 w-4" /> Notes
        </button>
        <p className="hidden font-mono text-[12px] text-ink-3 md:block">
          {now ? `Edited ${ago(note.updatedAt, now)}` : ""}
        </p>
        <div className="ml-auto flex items-center gap-1">
          {todos.length > 0 && (
            <button type="button" onClick={send} className="btn-pen">
              <Send className="h-4 w-4" />
              Send {todos.length} to list
            </button>
          )}
          <button
            type="button"
            onClick={() => togglePin(note.id)}
            aria-pressed={note.pinned}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            title={note.pinned ? "Unpin" : "Pin to top"}
            className={clsx("icon-btn", note.pinned && "text-ink")}
          >
            <Pin className="h-4 w-4" />
          </button>
          <button type="button" onClick={remove} aria-label="Delete note" title="Delete" className="icon-btn">
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="rounded-[10px] bg-card shadow-card">
        <div className="h-[2px] rounded-t-[10px] bg-red/85" />
        <textarea
          ref={ref}
          value={note.body}
          onChange={(e) => editNote(note.id, e.target.value)}
          placeholder={PLACEHOLDER}
          aria-label="Note"
          spellCheck
          style={{ ["--lh" as string]: "28px" }}
          className="ruled block w-full resize-none bg-transparent px-5 pb-8 pt-[10px] text-[15.5px] text-ink outline-none placeholder:text-ink-3 sm:px-7"
        />
      </div>
    </div>
  );
}

function NoteItem({ note, active, onOpen, today }: { note: Note; active: boolean; onOpen: () => void; today: string }) {
  const preview = notePreview(note);
  return (
    <li>
      <Swipe
        surface="bg-desk"
        right={{
          label: "Delete",
          tone: "red",
          icon: <Trash className="h-4 w-4" />,
          run: () => {
            const prev = deleteNote(note.id);
            toast("Note deleted", { label: "Undo", run: () => restore(prev) });
          },
        }}
      >
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={clsx(
          "block w-full rounded-lg px-3 py-2.5 text-left transition-colors",
          active ? "bg-card shadow-card" : "hover:bg-card/60",
        )}
      >
        <span className="flex items-center gap-1.5">
          {note.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-ink-3" />}
          <span className="truncate text-[14.5px] font-medium">{noteTitle(note)}</span>
          <span className="ml-auto shrink-0 pl-2 font-mono text-[11px] text-ink-3">
            {shortDay(dayKey(new Date(note.updatedAt)), today)}
          </span>
        </span>
        {preview && <span className="mt-0.5 line-clamp-2 text-[13px] text-ink-3">{preview}</span>}
      </button>
      </Swipe>
    </li>
  );
}

function Notes() {
  const notes = useNotes();
  const today = useToday();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("n");
  const [q, setQ] = useState("");

  const sorted = useMemo(
    () =>
      [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)),
    [notes],
  );
  const needle = q.trim().toLowerCase();
  const shown = needle ? sorted.filter((n) => n.body.toLowerCase().includes(needle)) : sorted;
  const current = id ? notes.find((n) => n.id === id) ?? null : null;

  const select = (nid: string | null) => router.replace(nid ? `/notes?n=${nid}` : "/notes", { scroll: false });

  // A note opened and left empty was never really written. Don't keep it.
  const prev = useRef<string | null>(id);
  useEffect(() => {
    const p = prev.current;
    if (p && p !== id) {
      const n = getState().db.notes[p];
      if (n && !n.deleted && !n.body.trim()) deleteNote(p);
    }
    prev.current = id;
  }, [id]);

  useEffect(() => {
    if (id && !current) select(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, current]);

  if (!today) return null;

  return (
    <div className="grid items-start gap-6 md:grid-cols-[290px_minmax(0,1fr)] md:gap-8">
      <aside className={clsx(current && "hidden md:block")}>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.03em]">Notes</h1>
          <button type="button" onClick={() => select(createNote("").id)} className="btn-ink">
            <Plus className="h-4 w-4" /> New note
          </button>
        </div>
        {notes.length > 5 && (
          <label className="mt-5 flex h-10 items-center gap-2 rounded-lg border border-hair bg-card/60 px-3 focus-within:border-pen/50">
            <Search className="h-4 w-4 text-ink-3" />
            <span className="sr-only">Search notes</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes"
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-3"
            />
          </label>
        )}
        {shown.length > 0 ? (
          <ul className="-mx-3 mt-4 space-y-0.5 md:mx-0">
            {shown.map((n) => (
              <NoteItem key={n.id} note={n} today={today} active={n.id === id} onOpen={() => select(n.id)} />
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
            {needle ? "No note mentions that." : "Meeting notes, ideas, anything longer than a task. Start one with New note."}
          </p>
        )}
      </aside>

      <section className={clsx(!current && "hidden md:block")}>
        {current ? (
          <Editor key={current.id} note={current} onBack={() => select(null)} />
        ) : (
          <div className="grid min-h-[320px] place-items-center rounded-[10px] border border-dashed border-hair px-6 text-center">
            <div>
              <p className="text-[14px] text-ink-2">Pick a note, or start a new one.</p>
              <p className="mt-1 text-[13px] text-ink-3">
                Write <span className="font-mono">[ ] something</span> on a line and you can send it to your list.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <Notes />
    </Suspense>
  );
}
