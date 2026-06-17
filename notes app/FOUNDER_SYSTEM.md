# Founder Execution System — Research, Context & Build Plan

## Vision

A productivity app for founders and high-performers who want to **control and understand their life through execution** — not by capturing more tasks, but by choosing fewer things and committing to them with precision.

**Who it's NOT for:** People who just want a to-do list.  
**Who it IS for:** People who already know they need a system but keep failing at follow-through.

The core problem: task lists create the illusion of productivity. Dumping 20 items and checking 3 feels like failure. This app reframes the game: pick 3 things that matter, protect them, finish them. Everything else is a bonus.

---

## Research Findings (Adversarially Verified, 108 Agents, 26 Sources)

### What is DEAD (Failed Rigorous Replication)

| Claim | Status | Evidence |
|-------|--------|----------|
| Ego depletion — "willpower is a finite resource" (Baumeister) | **FALSIFIED** | 23-lab RRR, N=2,141, d=0.04 vs claimed d=0.62. 36-lab follow-up: d=0.06 |
| Glucose restores willpower | **FALSIFIED** | Consequence of ego depletion model failure |
| Parole judge fatigue study | **REFUTED** | Confounded by timing/meal/case-order effects |
| If-then planning has d=0.61 effect on goal attainment | **CONTESTED** | Post-sensitivity-analysis drops to g~0.18; mechanism survives but magnitude doesn't |
| Daily progress is the "single most powerful driver" of performance | **REFUTED** | Progress Principle claims couldn't be verified from primary source |

### What is SOLID (Survived Adversarial Verification)

#### 1. Decision Fatigue is Real — but Not From a Depleted Resource
- **Fact:** After repeated decisions, people default to passivity, impulsivity, or the status quo option
- **Mechanism:** NOT ego depletion (that's debunked). Likely circadian, attentional, and motivational — separate mechanisms
- **App implication:** Reduce decisions. Batch choices. Give users defaults. Don't make them decide priorities mid-day

#### 2. If-Then Planning Works — Via Automatic Cue Encoding
- **Fact:** Implementation intentions ("When X happens, I will do Y at Z") encode a near-automatic link between cue and action
- **Mechanism:** Reduces reliance on effortful monitoring — the cue triggers the behavior reflexively
- **Boundary condition:** Effect diminishes under high cognitive load
- **App implication:** Force users to write "When [time/trigger], I will start [task] at [location/context]" — this is the implementation intention field

#### 3. Planning Fallacy — You Will Underestimate. Always.
- **Fact:** Systematic underestimation driven by 3 converging biases (Flyvbjerg 2021, N=2,062 projects):
  1. **Optimism bias** — unconsciously expect best-case scenarios
  2. **Uniqueness bias** — "my project is different from all past projects"
  3. **Planning fallacy** — ignore base rates of how long similar things took
- **Fix:** Reference class forecasting — ask "how long did the last 3 similar tasks actually take?"
- **App implication:** Show users their own historical estimation accuracy. When they enter "2 hours," show their average overrun rate

#### 4. Procrastination is a Unique Failure Mode — Not Fixed by Goals
- **Fact:** SMART goals do NOT reduce procrastination, even when fully complied with (Gustavson & Miyake 2017, RCT N=177, compliance confirmed at 4.25/5)
- **Fact:** Baseline procrastination predicts goal failure independently of conscientiousness, impulsivity, perfectionism, motivation, and confidence (β=-0.20, p=.046)
- **App implication:** Goal-setting features alone are useless for procrastinators. The app must reduce **activation energy** — the barrier to starting. The "first micro-step" field exists for this reason

#### 5. Dopamine Encodes Prediction Errors, Not Rewards
- **Fact:** Dopamine neurons fire for *unexpected* rewards, are silent for *expected* rewards, and dip *below baseline* when expected rewards are omitted (Schultz 1997, confirmed by PMC7804370)
- **App implication:**
  - Predictable task completion streaks lose their dopamine kick over time
  - Variable, milestone-based celebration (unexpected "you just hit 7 days") works better than constant badges
  - Progress indicators that show *unexpected* completion rates are more motivating

#### 6. Optimism Bias and Uniqueness Bias Are Distinct From Planning Fallacy
- Flyvbjerg's empirical ranking of biases in project planning (N=2,062 projects):
  1. Strategic misrepresentation (intentional)
  2. **Optimism bias** (unconscious best-case thinking)
  3. **Uniqueness bias** ("my situation is special")
  4. Planning fallacy (base-rate neglect)
  5. Overconfidence bias
- **App implication:** Time estimates need a "reality buffer" — show a recommended +30% to +50% padding based on user's own history

### Open Research Questions (Unanswered — Design Conservatively)
- Does context switching between founder roles (fundraising → product → hiring) produce measurable cognitive costs? (Likely yes, but magnitude unknown for real-world tasks vs lab tasks)
- What minimum block duration is needed to recover full cognitive throughput after a switch?
- Can reference class forecasting work without large personal datasets? (New users have no history — needs bootstrapping)
- What specifically reduces procrastination beyond activation energy lowering?

---

## The Philosophical Framework

### Problem With Every Other App

| App Type | What It Solves | What It Misses |
|----------|---------------|----------------|
| To-do list (Todoist, Things) | Task capture | Doesn't force prioritization; infinite list feels fine |
| Calendar (Google Cal) | Time scheduling | Doesn't capture intention or force triage |
| Notes (Notion, Obsidian) | Knowledge capture | Too open-ended; zero execution structure |
| Pomodoro timers | Focus sessions | No connection to priority or planning |
| GTD | Capture + organize | Requires massive maintenance overhead; no daily forcing function |
| OKRs / Goals apps | Outcome clarity | Too long-horizon; no daily execution bridge |

### What This App Does Differently

**Core mental model shift:** From "what do I need to do?" → "what am I committing to completing today, and what is it in service of?"

**Three non-negotiables the app enforces:**
1. You must plan your day before executing it (daily ritual)
2. You can only pick 3 Most Important Tasks (MITs) per day
3. After all 3 MITs are done, the day is a win — no guilt about the rest

**Five levers backed by science:**

| Lever | Science | Implementation |
|-------|---------|----------------|
| Reduce decisions | Decision fatigue is real (behavioral) | Pre-plan, defaults, batch choices in morning |
| Cue-based execution | Implementation intentions (Gollwitzer) | "When/I will/At" field on every task |
| Activation energy reduction | Procrastination ≠ laziness, it's barrier | "First micro-step" field on every task |
| Realistic time estimation | Planning fallacy (Flyvbjerg) | Time estimates + historical accuracy display |
| Dopamine-compatible progress | Prediction error encoding | Unexpected milestones, not constant badges |

---

## App Architecture

### Tech Stack
- **Flutter** (cross-platform: Android, iOS, Windows, macOS, Web)
- **SQLite** via sqflite
- **Provider** state management
- **Local notifications** via flutter_local_notifications

### Data Models

#### Task (Enhanced)
```
id, title, description
priority: 0=low, 1=medium, 2=high
energyLevel: 0=admin, 1=medium, 2=deep focus
estimatedMinutes: int?
firstStep: string          ← micro-action to reduce activation energy
implementationIntention: string  ← "When X, I will Y at Z"
isInbox: bool              ← not yet triaged to a day
completed, dueDate, projectId, parentId
recurrence, tags, subtasks
```

#### DailyPlan (New)
```
id: ISO date string ("2026-06-15")
mitTaskIds: List<String>   ← ordered, max 3
intentionText: string      ← what today is FOR
blockerNotes: string       ← anticipated obstacles
morningDone: bool          ← has planning ritual been completed
createdAt, updatedAt
```

### Screen Map

```
AppShell
├── Dashboard (Command Center)        ← REDESIGNED
│   ├── Planning CTA (if not planned)
│   ├── Today's Intention
│   ├── 3 MITs with start buttons
│   ├── Energy time budget bar
│   └── Habits strip
├── Daily Planning Wizard (NEW)       ← 5-step ritual
│   ├── Step 1: Reflect (why we plan)
│   ├── Step 2: Set Intention
│   ├── Step 3: Pick 3 MITs
│   ├── Step 4: Anticipate Blockers
│   └── Step 5: Commit & Review
├── Tasks                             ← Enhanced with energy/estimate/intention
├── Notes
├── Projects
├── Calendar
├── Journal
├── Habits
├── Stats                             ← Enhanced with MIT completion rate
├── Weekly Review
├── Focus Timer
└── Settings
```

---

## Build Plan (Sequential)

### ✅ Done
- [x] Task model: added `energyLevel`, `estimatedMinutes`, `firstStep`, `implementationIntention`, `isInbox`
- [x] Database: v7 migration (new task columns + daily_plans table)
- [x] `DailyPlan` model
- [x] `DailyPlanProvider`
- [x] `DailyPlanningScreen` (5-step wizard)

### 🔄 In Progress / Remaining
- [ ] **Dashboard** — redesign as Command Center (MITs hero, planning CTA, energy bar)
- [ ] **Task Editor** — add energy level, time estimate, first micro-step, implementation intention fields
- [ ] **Wire everything** — `DailyPlanProvider` in `main.dart`, new `AppSection.planning`, sidebar entry, shell routing
- [ ] **Stats** — MIT completion rate, estimation accuracy over time

---

## UI/UX Principles

### Design Philosophy
- **Opinionated, not flexible** — the system has opinions. You can't disable the 3-MIT limit. That's the point.
- **Friction in the right places** — adding a task to today's MITs requires intentionality. Adding to the inbox is frictionless.
- **Calm, not gamified** — no confetti, no streaks that cause anxiety. Progress shown honestly.
- **Mobile-first, tablet-aware** — founders are on phones. The morning ritual must work one-handed.

### Color System (existing, keep)
- Primary: `#6C63FF` (purple — focus, intentionality)
- Background light: `#F8F9FC`
- Background dark: `#1A1A2E`
- Card dark: `#1E1E2C`
- Energy levels: Teal (admin), Blue (medium), Deep Purple (deep focus)

### Typography Hierarchy
- Page titles: 26-28px, w800
- Section labels: 11px, w700, letterSpacing 1.5, ALL CAPS, primary color
- Body: 14-16px, h1.5-1.6
- Meta/timestamps: 11-12px, grey

---

## Key UX Flows

### Morning Flow (Happy Path)
1. Open app → Dashboard shows "Plan your day" CTA (if not planned)
2. Tap CTA → 5-step wizard opens
3. Step 1: Read the philosophy (30s)
4. Step 2: Write today's intention
5. Step 3: Tap to select 1-3 MITs from task list
6. Step 4: Write what might block you
7. Step 5: Review commitment → tap "Commit to Today"
8. Back to Dashboard → see 3 MITs with start buttons, intention displayed

### Execution Flow
1. Dashboard shows MIT #1 with "Start" button
2. Tap Start → opens Focus Timer pre-loaded with task name
3. Timer completes → task marked done, next MIT highlighted
4. All 3 MITs done → dashboard shows "Day won" state

### Capture Flow (Frictionless)
1. FAB → Quick Capture sheet
2. Type anything → goes to Inbox
3. Inbox tasks appear in MIT picker during next morning planning

---

## What Makes This Different From Notion/Todoist

| Feature | Todoist | Notion | This App |
|---------|---------|--------|----------|
| Forces daily planning ritual | No | No | **Yes** |
| Limits daily commitments | No | No | **3 MITs max** |
| Tracks estimation accuracy | No | No | **Yes** |
| Implementation intentions | No | No | **Yes — built into task** |
| Activation energy field | No | No | **Yes — "first step"** |
| Energy-matched scheduling | No | No | **Yes — admin/medium/deep** |
| Day "won" state at 3 MITs | No | No | **Yes** |
| Science-backed, not folk-psych | No | No | **Yes** |

---

## Sources (Peer-Reviewed, Survived Adversarial Verification)

1. Hagger et al. (2016) — Ego depletion RRR, N=2,141, *Perspectives on Psychological Science* — PMC5394171
2. Pignatiello et al. (2018) — Decision fatigue definition and manifestations — PMC6119549
3. McDaniel, Howard & Butler (2008) — Implementation intentions and cue-response encoding — *Memory & Cognition* 36(4):716-724
4. Schultz et al. (1997) + PMC7804370 — Dopamine prediction error encoding
5. Flyvbjerg (2021) — Top Ten Behavioral Biases in Project Management, N=2,062 — *Project Management Journal* 52(6) — arxiv 2202.00125
6. Gustavson & Miyake (2017) — SMART goals fail to reduce procrastination, RCT N=177 — *Learning and Individual Differences* — PMC5608091
