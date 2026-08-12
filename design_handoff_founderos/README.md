# Handoff: FounderOS — full product redesign

## Overview
FounderOS is a task/mind-management app for founders (web + iOS + Android, Next.js + Supabase, everything synced). This bundle redesigns it around one thesis: **the unit is an "open loop," not a task, and the product's job is to bring down "mind pressure" (unresolved loops) — not to raise a completion percentage.** Existing completion-based tools can never make a founder feel better because the number goes up when you add more work. This redesign inverts that.

## About the Design Files
The files in this bundle are **design references built in HTML** (self-contained "Design Component" files — plain HTML/CSS/inline-styles with a small React-like logic layer). They are prototypes showing intended look, content, and interaction — **not production code to copy directly**. The task is to **recreate these designs in the actual FounderOS codebase** (Next.js + Supabase for web; the existing iOS/Android native or Capacitor setup for mobile) using its existing components, routing, and data layer — not to ship this HTML as-is.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy and layout are final-intent. Interactive states (hover, screen switches, capacity math) are wired with fake/local data to demonstrate real behavior — a developer should treat the visual design as pixel-intent-accurate and wire it to real Supabase data and real routing.

## Files in this bundle
1. **FounderOS Blueprint.dc.html** — READ THIS FIRST. The product thinking: the six-stage loop (Capture → Clarify → Commit → Execute → Close → Review), the eight signature mechanics, the complete page/route map (21 routes, ~70 sub-views/modals), the three flows that matter most, and explicit "never do X, do Y instead" rules for how data is presented. This is the spec the other files implement.
2. **FounderOS Site.dc.html** — Public marketing/landing page. Hero, problem section, how-it-works, features-as-mechanics, cross-platform section, audience section, free-beta pricing section, footer.
3. **FounderOS App v2.dc.html** — The web app shell. Sidebar nav (grouped by loop stage) + header (mind pressure readout) + 16 screens: Today, Week, Triage (inbox), All loops, Loop detail, Projects, Notes, Focus, Shutdown, Reflect (journal), Weekly review, Pulse (stats), 90-day goals, Rituals (habits), Settings, plus a ⌘K quick-capture modal. Screens are switched via a `startScreen` prop / in-file tab state — see the `NAV` array and `state.screen` in the logic class to find each screen's exact markup block.
4. **FounderOS Rituals.dc.html** — The full-screen guided flows that should NOT be ordinary in-shell pages: morning plan (pick-3 with live capacity math), over-capacity intervention modal, focus pre-flight → running → park-a-thought → session-complete, rapid triage (keyboard-only four-way sort), delegate/handoff modal.
5. **FounderOS Onboarding.dc.html** — Signup, login, and 6-step onboarding (name/role → first capture → energy shape → 90-day goal → ritual times → first task already chosen), plus the "triage is empty" zero-state.
6. **FounderOS Mobile.dc.html** — 8 phone screens (Today, Capture, Triage, Focus running, Morning plan, Shutdown, lock-screen widgets, read-only weekly review) shown in a generic phone frame. Deliberately excludes a full task list, charts, and structural editing — see the "what mobile deliberately does not have" section at the bottom of that file.

## The core product model (see Blueprint for full detail)
- **Mind pressure**: one number (unresolved loops weighted by age/ambiguity/stakes), shown in the app header. The only score in the app; designed to go down.
- **Capacity budget**: a day holds 3 deep / 4 medium / 8 admin units. The morning planner blocks committing past this and forces a cut.
- **Loop decay**: loops age visibly — 7 days = amber ("aging"), 14 days = forced four-way answer (do it / schedule it / hand it off / drop it). This is what lets the list actually shrink.
- **The anti-list**: an explicit, visible "not doing this week" list with reasons — named on purpose so it stops nagging.
- **Shutdown ritual**: an evening flow (what shipped, park open loops with a next-move note, pick tomorrow's one thing, then a terminal "close the laptop" screen). This is the burnout-prevention half of the product.
- **First-move breakdown**: every task/loop carries a 2-minute first move + an if-then trigger, generated at clarify-time so nothing sits as an un-startable checkbox.
- **Delegation prompt**: aging loops surface a "should this be yours?" prompt with a pre-drafted handoff message.
- **Energy truth**: sessions log how work actually felt vs. what was planned; Pulse shows the gap per weekday (e.g. "Monday has never felt deep — stop planning it there").

## Design tokens
- **Colors**: background `#F6F3EC` (paper), surface `#FFFDF8`/`#FBF8F2`, border `#E6DFD2`/`#E0D9CB`, ink `#171512`, secondary text `#6B6459`/`#8A8378`, muted `#9A9285`/`#A69E90`. Accent (brand indigo, from the existing codebase's `lib/constants.ts`) `#5B4FE9` / hover `#4A3EDA` / tint `#EFECFE` / text-on-tint `#4A3EDA`. Energy colors (also from `lib/constants.ts` `PROJECT_COLORS`): Admin `#14B8A6`/`#0E8C7E`, Medium `#3B82F6`/`#2E6BD0`, Deep `#5B4FE9`. Warning/rot `#D9552F` (hot), `#B07C15`/`#F59E0B` (warm/amber), success `#0E8C7E`/`#E4F6F2`. Dark surfaces (focus/shutdown moments): `#171512` bg, `#201D18` panel, `#302C25` border, `#FBF8F2` text, `#A79DFF` accent-on-dark.
- **Typography**: headlines `Instrument Serif` (italic for emphasis words), body `Instrument Sans` (400/500/600/700), mono labels/data `JetBrains Mono` (400/500) — used for all-caps micro-labels, timers, metrics, chip tags.
- **Radius**: cards/panels 16–22px, buttons/pills 9–13px, small chips 6–8px.
- **Icons**: Lucide icon set (loaded via `unpkg.com/lucide`), never emoji — every icon in these files is `<i data-lucide="...">`, rendered via `window.lucide.createIcons()`.
- **Spacing**: page gutters 28–32px, section vertical rhythm ~110–150px on the marketing site, card padding 18–30px.

## Interactions & behavior worth preserving
- ⌘K opens quick-capture from anywhere, including mid-focus-session (see App v2 keydown handler).
- Screen navigation in App v2/Rituals/Onboarding/Mobile is driven by simple local state (`this.state.screen`) with a `startScreen` prop for deep-linking each screen in preview — in the real app this maps to actual Next.js routes (see Blueprint's page map for exact route paths, e.g. `/today`, `/inbox`, `/task/[id]`, `/plan`, `/focus`, `/shutdown`, `/review`, `/stats`, `/goals`, `/habits`, `/settings`, `/onboarding`, `/login`).
- Morning plan enforces capacity live: picking a 4th deep task flips the CTA and copy into an "over capacity" state (see `isOver`/`over` logic in Rituals).
- Triage rows are color-coded by decay tone (cool/warm/hot) and force a non-dismissible banner at 14 days old.
- Focus session has a "park a thought" path that opens capture without ending the timer.

## Assets
No external image assets — the landing page and app use `<image-slot>` placeholders (a drag-and-drop component, `image-slot.js` in the project root) for product screenshots/device photos; a real developer/designer should drop real screenshots into those slots or export screens from the actual app once built. All icons are Lucide (CDN), no custom SVG icon set to hand off.

## Source grounding
Palette and energy colors were pulled from the existing codebase's `lib/constants.ts` (`PROJECT_COLORS`); nav grouping patterns were referenced from the existing `components/app-shell.tsx`; onboarding step count/structure was referenced from the existing `app/onboarding/page.tsx`. Recreate against the current versions of those files, not this snapshot.
