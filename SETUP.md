# FounderOS

Dump tasks, pick a few for today, keep the list honest. Plus notes.

The app is `founder-web/`: three screens — **Today**, **List**, **Notes** — and one capture box that sits on every screen.

## How it works

**Capture.** Type in the box and press Enter. It goes to your list. Paste several lines and each becomes its own task. Words it understands:

| You type | It does |
| --- | --- |
| `today` / `tonight` | Puts it straight on Today |
| `tomorrow`, `fri`, `next week`, `in 3 days`, `12 nov` | Sets a deadline |
| `!` (alone, or at the start) | Stars it |

Writing something that's already on the list doesn't add a twin. It bumps the one that's there ("You wrote this down 3 times").

**Today** is an index card. Pick a few from *Up next*, finish them, then pick more. When the card is empty, **Pick these 3** takes the top three. Anything you don't finish goes back to the list at midnight, counted as *carried over*. After it's been carried three times, the list tells you to do it or let it go.

**The list ranks itself** using facts the task already carries: deadlines first, then stars, carried-over tasks, and things you wrote down more than once. Every day a task sits untouched costs it a little. Each row says why it's where it is.

**The list stays small.** It holds **30**. Anything below the line, or untouched for **3 weeks** with no star or deadline holding it up, starts to *fade*. **7 days** later it's cleared to the archive unless you hit **Keep**. Nothing is deleted: *Done and let go* holds it all, and you can restore anything.

Other limits: **5 stars** at most (if everything is starred, nothing is). Deadlines more than a week out and snoozed tasks wait under **Later**, out of the way, and come back on their own.

**Notes** are plain text. The first line is the title. Write `[ ] something` on a line and **Send to list** turns it into a task, then marks the line `[>]`.

All of these numbers are in one place: `founder-web/lib/model.ts`.

## Run it

```bash
cd founder-web
npm install
npm run dev        # http://localhost:3000
npm test           # the ranking, fading, capture and sync-merge rules
npm run build      # static site in out/ — deploy anywhere (Vercel works as-is)
```

Shortcuts: `/` or `n` jumps to the capture box, `⌘K` works from anywhere, and `Esc` closes things.

On a phone, open the deployed URL and choose **Add to Home Screen**. It runs full-screen and works offline.

## Data and sync

Everything saves **on the device first** (browser storage), so the app opens instantly, works offline, and never breaks because a server is down. **Sync & backup** (top right) also lets you download a backup file and restore one.

To share one list between your phone and your laptop, turn on sync:

1. Create a Supabase project (or restore the old one).
2. Run `founder-web/supabase/schema.sql` in its SQL editor. That's one table and one function, and it doesn't touch any other table.
3. Put the project URL and anon key in `founder-web/.env.local` (see `.env.local.example`), then rebuild and redeploy.
4. Open **Sync & backup** in the app and sign in. Everything already on that device goes up on the first sign-in.

Each task and note syncs as one record. If the same record was edited on two devices, the most recent edit wins.

> The Supabase project in the current `.env.local` no longer resolves (it was probably paused and removed while the app sat unused). Until you replace those two values, the app runs device-only.

## What's not here any more

Goals, habits, journal, focus timer, rituals, projects, stats and weekly review were removed on purpose. Git history has them.

`notes app/` (the Flutter app) and `supabase/schema.sql` at the repo root belong to that older version. They haven't been changed and don't talk to the new app.
