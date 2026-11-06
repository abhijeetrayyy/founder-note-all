# FounderOS

Dump tasks, pick a few for today, keep the list honest. Plus notes.

The app is `founder-web/`: three screens — **Today**, **List**, **Notes** — and one capture box that sits on every screen.

## How it works

**Capture.** Type in the box and press Enter. It goes to your list. The box stays pinned to the top while you scroll. Paste several lines and each becomes its own task; lines already ticked off (`[x]`) are skipped. Words it understands:

| You type | It does |
| --- | --- |
| `today` / `tonight` | Puts it straight on Today |
| `tomorrow`, `fri`, `by Monday`, `next week`, `in 3 days`, `12 nov` | Sets a deadline |
| `!` (alone, or at the start) | Stars it |

What it understood shows as chips beside the text. If you meant the word (say, "USA Today"), tap the chip and it stays part of the title. Writing something that's already on the list bumps that task instead of adding a twin ("You wrote this down 3 times").

**Today** is an index card. Pick a few from *Up next*, finish them, then pick more. When the card is empty, **Pick these 3** takes the top three. The day turns over at **4am**, not midnight, so late nights aren't punished. Anything you didn't finish goes back to the list, marked as carried over.

**The list ranks itself** by deadlines first, then stars, tasks left over from yesterday, and things you wrote down more than once. Every day a task sits untouched costs it a little, and each row says why it's where it is. Two limits stop tasks gaming the ranking:

- After three carry-overs a task stops climbing; the list asks about it instead.
- A deadline missed by more than a week stops outranking everything.

**One thing to decide.** At the top of List, the app asks one question at a time, with likely answers as buttons:
- *Overdue:* do it today, move it a week, or delete it.
- *Carried over 3 times:* do it first today, make it smaller (rewrite it as the first step), or delete it.
- *Looks like a duplicate:* merge them; nothing written on either is lost.
- *Untouched 2 weeks:* keep it, not this month, or delete it.

Skip stays quiet for a week. It asks at most **3 questions a day**, so it can't nag.

**The list stays small.** It holds **30**, and shows how long that is at your pace ("≈ 8 days of work"). Some things fade, and are deleted 7 days later unless you tap **Keep**:
- anything below the line
- anything untouched for 3 weeks with no star or live deadline holding it up

Keep holds a task's place for a week. Something you just wrote never starts below the line; older tasks give way instead. **Delete all below the line** clears them in one tap. The list tells you once a week what faded. Something that faded comes back with its history if you write it down again.

**Deleting.** Every task has **Delete**:
- in its sheet (tap the title)
- as a trash icon on hover (desktop)
- by swiping left (phone)

Swipe right puts it on Today. On Today, swipe right is Done and swipe left sends it back to the list. Nothing asks "are you sure?": you get **Undo**, and deleted tasks stay in **Recently deleted** for 30 days before they're gone for good.

Other limits: **5 stars** at most (if everything is starred, nothing is). Deadlines more than a week out and snoozed tasks wait under **Later**, out of the way, and come back on their own.

**Notes** are plain text. The first line is the title. Write `[ ] something` on a line and **Send to list** turns it into a task, then marks the line `[>]`. Swipe a note left to delete it.

All of the limits are in `founder-web/lib/model.ts`, and the questions' rules are in `founder-web/lib/suggest.ts`.

## Run it

```bash
cd founder-web
npm install
npm run dev        # http://localhost:3000
npm test           # ranking, fading, questions, capture parsing, undo and sync merge
npm run build      # static site in out/ — deploy anywhere (Vercel works as-is)
```

Shortcuts: `/` or `n` jumps to the capture box, `⌘K` works from anywhere, and `Esc` closes things.

## Android app

The Android app is this same app inside a native shell ([Capacitor](https://capacitorjs.com)). Everything is bundled into the APK, so it opens instantly and works with no network. Sync works exactly like the web version: sign in from **Sync & backup**.

```bash
cd founder-web
npm run android:apk
```

The APK lands in `founder-web/android/app/build/outputs/apk/debug/app-debug.apk`. It needs Android Studio's Java (`export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`) and the Android SDK.

Install it either way:

- **USB:** turn on Developer options → USB debugging on the phone, plug it in, then `adb install -r <apk>`.
- **File:** copy the APK to the phone (Drive, email, cable), tap it, and allow "Install unknown apps" for whatever opened it.

Builds from this Mac install over each other, because they're signed with the same debug key. If an older FounderOS app is already on the phone and refuses to update, uninstall it first.

The app icon and launch screen come from `founder-web/assets/`. To regenerate them, run `npx @capacitor/assets generate --android`.

You can also skip the APK: open the deployed URL in Chrome on the phone and choose **Add to Home Screen**. It runs full-screen and works offline.

## Data and sync

Everything saves **on the device first** (browser storage), so the app opens instantly, works offline, and never breaks because a server is down. **Sync & backup** (top right) also lets you download a backup file and restore one.

To share one list between your phone and your laptop, turn on sync:

1. Create a Supabase project (or restore the old one).
2. Run `founder-web/supabase/schema.sql` in its SQL editor. That's one table and one function, and it doesn't touch any other table.
3. Put the project URL and anon key in `founder-web/.env.local` (see `.env.local.example`), then rebuild and redeploy.
4. Open **Sync & backup** in the app and sign in. Everything already on that device goes up on the first sign-in.

Each task and note syncs as one record. If the same record was edited on two devices, the most recent edit wins. The app's own housekeeping (rollover at 4am, fading, emptying Recently deleted) is never synced as an edit. Each device works it out for itself, so an old laptop waking up can't overwrite what you did on your phone.

Free Supabase projects pause after about a week without use. If that happens, the app keeps working on each device and catches up when you resume the project in the Supabase dashboard.

## What's not here any more

Goals, habits, journal, focus timer, rituals, projects, stats and weekly review were removed on purpose. Git history has them.

`notes app/` (the Flutter app) and `supabase/schema.sql` at the repo root belong to that older version. They haven't been changed and don't talk to the new app.
