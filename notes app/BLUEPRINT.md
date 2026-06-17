# Founder — Execution System Blueprint

> **Version:** 2.0 built · **Next:** 2.1 planned  
> **Concept:** One place to capture, plan, execute, and reflect.
> **Target:** Founders, builders, and people who ship. Not another note app — an operating system for getting things done.

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [Current State — What's Built](#2-current-state--whats-built)
3. [Architecture Overview](#3-architecture-overview)
4. [Screen-by-Screen Flow](#4-screen-by-screen-flow)
5. [Data Model](#5-data-model)
6. [What Needs To Be Built Next](#6-what-needs-to-be-built-next)
7. [Feature Specifications](#7-feature-specifications)
8. [Design System & UX Principles](#8-design-system--ux-principles)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [File Structure (Current + Planned)](#10-file-structure)

---

## 1. Vision & Philosophy

### The Problem
Founders use 5+ tools to manage their life: a notes app, a task manager, a calendar, a journal, a project tracker, a habit tracker. Context-switching kills flow. Fragmented data means nothing connects.

### The Solution
**Founder** is a unified execution environment. It treats thoughts, tasks, projects, and reflections as different views of the same underlying data — your mind's output. Everything links. Everything is searchable. Everything is one place.

### Design Principles
- **Speed first** — Capture a thought in under 2 seconds. Quick Capture is always one tap away.
- **Progressive complexity** — Dashboard is simple. Power features are discoverable, not in-your-face.
- **Connected data** — Notes belong to projects. Tasks have deadlines. Everything cross-references.
- **Offline-first** — SQLite on device. No accounts. No cloud lock-in. Export/Import for portability.
- **Calm interface** — Clean typography, generous whitespace, no unnecessary UI chrome.

### User Journey
```
Open app → Dashboard (today at a glance)
        → Capture a thought (Quick Capture FAB)
        → Review tasks, check one off
        → Browse notes, find something
        → Open a project, see all related items
        → Search globally across everything
        → At end of day: review, journal, plan tomorrow
```

---

## 2. Current State — What's Built

### Modules (v2.0)

| Module | Status | Features |
|--------|--------|----------|
| **Dashboard** | Built | Today greeting, stats row, today's tasks, recent notes, quick capture sheet |
| **Sidebar** | Built | Collapsible (wide) / drawer (narrow), 5 nav items with badges, search trigger |
| **Notes** | Built | Full CRUD, markdown rendering, grid/list toggle, sort, search, swipe archive/delete, undo, pin, lock, categories, project assignment, 10 colors |
| **Tasks** | Built | Full CRUD, 3 priority levels (color-coded), due date picker, project assignment, active/completed lists, search |
| **Projects** | Built | Full CRUD, 12 icons, color picker, note + task count per project, detail view with linked items |
| **Settings** | Built | Dark mode toggle, export all data as JSON, import backup |
| **Search** | Built | Full-text search via SQLite FTS4 on notes and tasks |
| **Database** | Built | 3 tables (notes, tasks, projects), version migration v1→v2→v3, FTS triggers |
| **Preferences** | Built | Dark mode, sidebar state persisted via SharedPreferences |
| **Quick Capture** | Built | Bottom sheet: choose Note or Task, type, save — one-tap from Dashboard FAB |

### Tech Stack
- Flutter 3.27 + Dart 3.6
- State: Provider (4 providers)
- DB: SQLite via sqflite (with FTS4)
- 13 dependencies (equatable, shared_preferences, flutter_slidable, flutter_markdown, file_picker, image_picker, speech_to_text, intl, uuid, provider, sqflite, path, flutter_lints)

### What's Not Yet Built

| Priority | Feature | Why |
|----------|---------|-----|
| P0 | **Reminders & Notifications** | Tasks without reminders are just notes. Core to execution. |
| P0 | **Calendar / Timeline View** | See tasks on a date grid. Plan weeks. |
| P1 | **Journal Module** | Daily reflection, separate from notes. Timestamped entries. |
| P1 | **Tags System** | Cross-cutting labels beyond categories. "urgent", "follow-up", "growth" |
| P1 | **Recurring Tasks** | "Every Monday: team standup." "Every day: review inbox." |
| P2 | **Habit Tracker** | Daily yes/no habits with streaks. |
| P2 | **Weekly Review Mode** | Guided review: what shipped, what didn't, what's next. |
| P2 | **Focus Timer** | Pomodoro-style focus sessions linked to tasks. |
| P2 | **Statistics / Analytics** | Productivity trends, completion rates, streak counts. |
| P3 | **Command Palette** | Cmd/Ctrl+K to search, create, navigate — keyboard-first power users. |
| P3 | **Templates** | Pre-built note/project templates. "Sprint Planning", "OKRs", "1:1 Notes" |
| P3 | **Cloud Sync** | Optional Firebase/Supabase backup. Not required. |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AppShell                              │
│  ┌──────────┐  ┌──────────────────────────────────────────┐ │
│  │ Sidebar   │  │            Content Area                  │ │
│  │           │  │  ┌──────────────────────────────────────┐│ │
│  │ Dashboard │  │  │  Dashboard / Notes / Tasks /         ││ │
│  │ Tasks     │  │  │  Projects / Settings / Journal /     ││ │
│  │ Notes     │  │  │  Calendar / Habits                   ││ │
│  │ Projects  │  │  │                                      ││ │
│  │ Journal   │  │  │  (routed by AppProvider.section)     ││ │
│  │ Calendar  │  │  │                                      ││ │
│  │ Settings  │  │  └──────────────────────────────────────┘│ │
│  └──────────┘  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Provider Architecture
```
AppProvider          → Section nav, theme, sidebar, global search
NotesProvider        → Notes list, CRUD, sort, search
TasksProvider        → Tasks list, CRUD, toggle, due filter
ProjectsProvider     → Projects list, CRUD
▸ Planned:
ReminderProvider     → Scheduled notifications
JournalProvider      → Journal entries, daily log
HabitProvider        → Habits, streaks, daily check
CalendarProvider     → Aggregated calendar view (tasks + events)
```

### Database Schema (v3.0 planned)
```sql
-- Current (v2.0)
notes (id, title, content, category, color, projectId, createdAt, updatedAt, isPinned, isArchived, isLocked)
tasks (id, title, description, priority, completed, dueDate, projectId, createdAt, updatedAt)
projects (id, name, description, color, iconIndex, createdAt, updatedAt)

-- Planned (v3.0)
tags (id, name, color, createdAt)
note_tags (noteId, tagId)
task_tags (taskId, tagId)
journal_entries (id, content, mood, createdAt)
habits (id, name, color, iconIndex, createdAt)
habit_logs (id, habitId, date, done)
reminders (id, taskId, remindAt, notified)
```

---

## 4. Screen-by-Screen Flow

### 4.1 Dashboard (Home)
```
┌──────────────────────────────────────────┐
│ Good Morning, ▾                    🌙 🔍 │
│                                          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Today │ │Tasks │ │Notes │ │Proj  │     │
│ │  3   │ │  12  │ │  24  │ │  5   │     │
│ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                          │
│ TODAY'S TASKS                    View all│
│ ┌──────────────────────────────────────┐ │
│ │ 🔴 Ship v2.1 build          Jun 10  │ │
│ │ 🟡 Review PRs               Jun 10  │ │
│ │ 🟢 Read 10 pages                    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ RECENT NOTES                    View all│
│ ┌──────────────────────────────────────┐ │
│ │ 📝 Meeting notes - investors         │ │
│ │ 📝 Product roadmap Q3                │ │
│ └──────────────────────────────────────┘ │
│                                          │
│            [+ Quick Capture]             │
└──────────────────────────────────────────┘
```

### 4.2 Tasks Screen
```
┌──────────────────────────────────────────┐
│ Tasks                          ≡ 🔍 sort│
│ ┌──────────────────────────────────────┐ │
│ │ 🔍 Search tasks...                   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ACTIVE (8)                               │
│ ┌──────────────────────────────────────┐ │
│ │ 🔴 ○ Ship v2.1          Jun 10  🗑  │ │
│ │ 🟡 ○ Review PRs         Jun 10  🗑  │ │
│ │ 🟢 ○ Read 10 pages              🗑  │ │
│ │ 🟡 ○ Gym session                 🗑  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ COMPLETED (4)                            │
│ ┌──────────────────────────────────────┐ │
│ │ ✓ Design review               🗑    │ │
│ │ ✓ Buy groceries               🗑    │ │
│ └──────────────────────────────────────┘ │
│                                   [+ Task]│
└──────────────────────────────────────────┘
```

### 4.3 Notes Screen
```
┌──────────────────────────────────────────┐
│ Notes                          ▦ sort  +│
│ ┌──────────────────────────────────────┐ │
│ │ 🔍 Search notes...                   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │📝 Inv.. │ │📝 Road │ │📝 Desi │       │
│ │        │ │map     │ │notes   │       │
│ │invest..│ │Q3 plan │ │        │       │
│ │Work    │ │Product │ │Design  │       │
│ └────────┘ └────────┘ └────────┘       │
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │📝 Read │ │📝 Ideas │ │📝 Gym  │       │
│ │list    │ │        │ │plan    │       │
│ └────────┘ └────────┘ └────────┘       │
│                                   [+ Note]│
└──────────────────────────────────────────┘
```

### 4.4 Projects Screen → Detail
```
Projects List:                          Project Detail:
┌────────────────────┐                  ┌────────────────────┐
│ 📁 Work     3n 5t  │                  │ 📁 Work            │
│ 📁 Personal 5n 2t  │       →          │ Ship the product   │
│ 📁 Fitness  2n 4t  │                  │                    │
│ 📁 Learning 8n 1t  │                  │ TASKS (5)    + Add │
│                    │                  │ ○ Ship v2.1        │
│              [+ New]│                  │ ○ Review PRs       │
└────────────────────┘                  │                    │
                                        │ NOTES (3)    + Add │
                                        │ 📝 Meeting notes   │
                                        │ 📝 Roadmap Q3      │
                                        └────────────────────┘
```

### 4.5 Calendar View (Planned)
```
┌──────────────────────────────────────────┐
│ June 2026                        ◀ ▶    │
│ Mon  Tue  Wed  Thu  Fri  Sat  Sun       │
│  1    2    3    4    5    6    7        │
│        ▸▸▸  ▸                ▸          │
│  8    9   10   11   12   13   14        │
│  ▸▸   ▸▸▸  ▸    ▸▸   ▸                 │
│ 15   16   17   18   19   20   21        │
│                                         │
│ ── Tue Jun 9 ────────────────────────── │
│ 🔴 Ship v2.1 build                      │
│ 🟡 Review PRs                           │
│ 🟡 Gym session (recurring)             │
│ 📝 Created "meeting notes" (note)       │
└──────────────────────────────────────────┘
```

### 4.6 Journal (Planned)
```
┌──────────────────────────────────────────┐
│ Journal                         ◀ ▶    │
│                                          │
│ Tue, June 9, 2026                       │
│ ┌──────────────────────────────────────┐ │
│ │ How was today?                       │ │
│ │                                      │ │
│ │ Shipped the APK build. Good progress │ │
│ │ on the sidebar. Need to fix the icon │ │
│ │ tree-shaking issue tomorrow.         │ │
│ │                                      │ │
│ │ Mood: 😊 Productive                  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Mon, June 8, 2026                       │
│ ┌──────────────────────────────────────┐ │
│ │ Started the rewrite. Architecture    │ │
│ │ feels solid.                         │ │
│ │ Mood: 🤔 Thoughtful                  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│            [+ Today's Entry]             │
└──────────────────────────────────────────┘
```

---

## 5. Data Model

### Current Tables
```
notes
├── id: TEXT PRIMARY KEY
├── title: TEXT
├── content: TEXT (markdown)
├── category: TEXT (General|Work|Personal|Ideas|Todo)
├── color: INTEGER
├── projectId: TEXT FK → projects.id
├── createdAt: TEXT (ISO 8601)
├── updatedAt: TEXT
├── isPinned: INTEGER (0|1)
├── isArchived: INTEGER (0|1)
└── isLocked: INTEGER (0|1)

tasks
├── id: TEXT PRIMARY KEY
├── title: TEXT
├── description: TEXT
├── priority: INTEGER (0=low, 1=medium, 2=high)
├── completed: INTEGER (0|1)
├── dueDate: TEXT (ISO 8601, nullable)
├── projectId: TEXT FK → projects.id
├── createdAt: TEXT
└── updatedAt: TEXT

projects
├── id: TEXT PRIMARY KEY
├── name: TEXT
├── description: TEXT
├── color: INTEGER
├── iconIndex: INTEGER (0-11)
├── createdAt: TEXT
└── updatedAt: TEXT
```

### Planned Tables (v3.0)
```
journal_entries        habits                 habit_logs
├── id                 ├── id                 ├── id
├── content            ├── name               ├── habitId FK
├── mood (int 0-4)     ├── color              ├── date
└── createdAt          ├── iconIndex           └── done (0|1)
                       └── createdAt
tags                   reminder
├── id                 ├── id
├── name               ├── taskId FK
├── color              ├── remindAt
└── createdAt          └── notified (0|1)
```

---

## 6. What Needs To Be Built Next

### Phase A — Execution Core (P0)
These make Founder actually useful for daily execution.

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| A1 | **Reminders** | Set reminder date/time on tasks. Android notification with `flutter_local_notifications`. Snooze support. | Medium |
| A2 | **Calendar View** | Monthly grid + day detail. Tasks with due dates shown on calendar. Tap day to see that day's items. | Medium |
| A3 | **Recurring Tasks** | "Repeat: daily / weekly / monthly / custom". On completion, next instance auto-created. | Medium |
| A4 | **Sub-tasks** | Checklist within a task. Parent task shows "2/5 done". | Small |
| A5 | **Notifications Service** | Background check for due reminders. Schedule notifications on app start. | Medium |

### Phase B — Reflection & Journal (P1)
Separate journaling from note-taking. Different intent, different UI.

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| B1 | **Journal Module** | New sidebar item. Daily entries with date stamp. Mood selector. Rich text. | Medium |
| B2 | **Journal Prompts** | Optional daily prompts: "What did you ship today?", "What are you grateful for?", "What's the one thing tomorrow?" | Small |
| B3 | **Journal Streak** | Consecutive days counter. Visual streak on journal header. | Small |
| B4 | **Mood Tracking** | Quick mood picker (5 emoji states). Mood chart over time. | Small |

### Phase C — Organization (P1)
Cross-cutting organization beyond projects.

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| C1 | **Tags System** | Create/edit/delete tags. Assign to notes and tasks. Filter by tag across modules. | Medium |
| C2 | **Smart Lists** | Auto-filtered views: "Due this week", "High priority", "No project", "Recently created". | Small |
| C3 | **Favorites** | Star/favorite any note, task, or project. "Favorites" smart list in sidebar. | Small |
| C4 | **Global Search Enhancement** | Search across notes, tasks, journal, projects simultaneously. Result grouping by type. | Medium |

### Phase D — Habits (P2)
Daily accountability.

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| D1 | **Habit Tracker** | Create habits with name, color, icon. Daily check-in grid. | Medium |
| D2 | **Streak Counter** | "12 days" streak. Visual fire icon. Best streak tracking. | Small |
| D3 | **Habit Stats** | Weekly/monthly completion rate. Charts. | Small |
| D4 | **Dashboard Integration** | Show today's habits on Dashboard alongside tasks. | Small |

### Phase E — Power Tools (P2-P3)
For advanced users.

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| E1 | **Command Palette** | Ctrl+K / Cmd+K opens search/command bar. Type to navigate or create. | Medium |
| E2 | **Templates** | Save note/task/project as template. "New from template" in create flow. | Medium |
| E3 | **Weekly Review** | Guided flow: review completed tasks, unfinished tasks, notes created, plan next week. | Medium |
| E4 | **Focus Timer** | Start a focus session linked to a task. Timer runs, logs session. | Small |
| E5 | **Statistics Dashboard** | Charts: tasks completed per day/week, notes created, habits adherence, mood trends. | Medium |
| E6 | **Widgets (Android)** | Home screen widget: today's tasks, quick capture button. | Medium |

---

## 7. Feature Specifications

### 7.1 Reminders System

**Flow:**
1. User creates/edits a task → sets due date → toggles "Remind me"
2. Picks reminder time (default: 9 AM on due date, or custom)
3. App schedules `flutter_local_notifications` alarm
4. At reminder time → Android notification with task title and actions: "Complete", "Snooze 30 min"
5. On app open → check for missed reminders, re-schedule

**Data:**
```dart
class Reminder {
  final String id;
  final String taskId;
  final DateTime remindAt;
  bool notified;
}
```

**Dependencies:** `flutter_local_notifications`, `timezone`

### 7.2 Calendar View

**Layout:**
- Month grid at top (7 columns, swipeable between months)
- Day detail below: tasks due on selected day, notes created that day
- Dots under dates with items (color-coded by priority)
- "Today" button to jump back

**Data Source:** `tasks` filtered by `dueDate`, `notes` filtered by `createdAt`

### 7.3 Journal Module

**Flow:**
1. Tap "Journal" in sidebar → today's entry (or blank if none)
2. Write freeform entry. Markdown supported.
3. Pick mood from 5 options: 😊 Productive, 😐 Neutral, 🤔 Thoughtful, 😤 Stressed, 😴 Tired
4. Save → entry appears in reverse-chronological list
5. Streak counter at top: "🔥 12 day streak"

**Design:** Minimal. Full-width text area. One mood row at bottom. No categories, no colors, no projects. Journal is pure reflection.

### 7.4 Tags System

**Flow:**
1. Settings → Manage Tags → Create/Edit/Delete
2. In note/task editor → tag chips below category selector
3. Sidebar → "Tags" section expands to show all tags with counts
4. Tap a tag → filtered view showing all notes + tasks with that tag

**Data:**
```sql
tags (id, name, color)
note_tags (noteId, tagId)  -- junction table
task_tags (taskId, tagId)
```

### 7.5 Dashboard Enhancement

**Current:** Stats row, today's tasks, recent notes, quick capture FAB.

**Planned additions:**
- Smart greeting: "Good morning, you have 3 tasks due today and a 12-day journal streak."
- Habit row: horizontal scroll of today's habits with check circles
- Focus quote: random curated quote near the top
- Weather/time: subtle, optional
- "Review yesterday" card → links to yesterday's journal entry or completed tasks

---

## 8. Design System & UX Principles

### Color Palette
```
Primary:    #6C63FF (purple-blue)
Accent:     #FF6584 (coral-pink)

Light:
  Background: #F8F9FC
  Surface:    #FFFFFF
  Text:       #1A1A2E
  Subtle:     #8E8E9A

Dark:
  Background: #1A1A2E
  Surface:    #1E1E2C
  Text:       #FFFFFF
  Subtle:     #8E8E9A
```

### Typography
- App name: 22px, weight 700, letter-spacing -0.5
- Section headers: 13px, weight 600, color: grey
- Body: 14-16px, height 1.6
- Cards: 14px title, 12px metadata

### Spacing
- Screen padding: 20px
- Card padding: 14-16px
- Card gap: 8-10px
- Border radius: 14-16px (cards), 20px (chips)

### Interaction Patterns
- **Tap:** Open/view
- **Long press:** Context menu (bottom sheet)
- **Swipe left:** Archive (blue) or Delete (red)
- **Swipe right:** Pin/Unpin
- **Pull down:** Refresh

### Empty States
Every module has a friendly empty state with icon, title, subtitle, and call-to-action. No blank screens ever.

### Responsive Behavior
- **>800px wide:** Permanent sidebar (260px or collapsed 72px)
- **<800px wide:** Drawer sidebar, full-width content
- **Grid/List toggle:** User preference, persisted

---

## 9. Implementation Roadmap

### v2.1 — Execution Core (Target: 1-2 weeks)
```
[ ] Add flutter_local_notifications + timezone dependencies
[ ] Create Reminder model + database table
[ ] Create ReminderProvider
[ ] Add reminder UI to TaskEditorScreen (date picker + time picker + toggle)
[ ] Implement notification scheduling
[ ] Build CalendarScreen (month grid + day detail)
[ ] Add Calendar to sidebar navigation
[ ] Add recurring task toggle + logic
[ ] Add sub-tasks within TaskEditorScreen
[ ] Run tests + build APK
```

### v2.2 — Journal & Tags (Target: 1 week)
```
[ ] Create JournalEntry model + database table + FTS
[ ] Create JournalProvider
[ ] Build JournalScreen (daily entry list)
[ ] Build JournalEditorScreen (write + mood picker)
[ ] Add Journal to sidebar
[ ] Create Tag model + junction tables
[ ] Create TagProvider
[ ] Add tag UI to NoteEditor and TaskEditor
[ ] Add tag filter to sidebar
[ ] Build SmartLists (filtered views)
```

### v2.3 — Habits & Stats (Target: 1 week)
```
[ ] Create Habit model + database tables
[ ] Create HabitProvider
[ ] Build HabitTrackerScreen (grid layout)
[ ] Add daily habit check to Dashboard
[ ] Build StatisticsScreen (charts, trends)
[ ] Add streak tracking to Journal and Habits
```

### v2.4 — Power Tools (Target: 1-2 weeks)
```
[ ] Build CommandPalette (Ctrl+K overlay)
[ ] Template system (save/load)
[ ] Weekly Review flow
[ ] Focus Timer
[ ] Home screen widget
[ ] Final polish + performance audit
```

---

## 10. File Structure

### Current (v2.0)
```
lib/
├── main.dart
├── models/          note.dart, task.dart, project.dart
├── services/        database_service.dart
├── providers/       app_provider.dart, notes_provider.dart,
│                   tasks_provider.dart, projects_provider.dart
├── screens/
│   ├── app_shell.dart
│   ├── dashboard_screen.dart
│   ├── settings_screen.dart
│   ├── notes/       notes_screen.dart, note_editor_screen.dart
│   ├── tasks/       tasks_screen.dart, task_editor_screen.dart
│   ├── projects/    projects_screen.dart, project_detail_screen.dart
│   └── widgets/     sidebar.dart, note_card.dart
└── theme/           app_theme.dart
```

### Planned (v2.4)
```
lib/
├── main.dart
├── models/
│   ├── note.dart
│   ├── task.dart
│   ├── project.dart
│   ├── tag.dart              ─ new
│   ├── reminder.dart         ─ new
│   ├── journal_entry.dart    ─ new
│   └── habit.dart            ─ new
├── services/
│   ├── database_service.dart
│   └── notification_service.dart  ─ new
├── providers/
│   ├── app_provider.dart
│   ├── notes_provider.dart
│   ├── tasks_provider.dart
│   ├── projects_provider.dart
│   ├── tag_provider.dart         ─ new
│   ├── reminder_provider.dart    ─ new
│   ├── journal_provider.dart     ─ new
│   └── habit_provider.dart       ─ new
├── screens/
│   ├── app_shell.dart
│   ├── dashboard_screen.dart
│   ├── settings_screen.dart
│   ├── calendar_screen.dart      ─ new
│   ├── journal/                  ─ new
│   │   ├── journal_screen.dart
│   │   └── journal_editor_screen.dart
│   ├── habits/                   ─ new
│   │   └── habits_screen.dart
│   ├── stats/                    ─ new
│   │   └── stats_screen.dart
│   ├── notes/
│   │   ├── notes_screen.dart
│   │   └── note_editor_screen.dart
│   ├── tasks/
│   │   ├── tasks_screen.dart
│   │   └── task_editor_screen.dart
│   ├── projects/
│   │   ├── projects_screen.dart
│   │   └── project_detail_screen.dart
│   └── widgets/
│       ├── sidebar.dart
│       ├── note_card.dart
│       ├── task_tile.dart            ─ new
│       ├── command_palette.dart      ─ new
│       └── calendar_widget.dart      ─ new
└── theme/
    └── app_theme.dart
```

---

## Appendix: Dependencies

### Current (v2.0)
```yaml
sqflite, path, provider, intl, uuid, shared_preferences,
flutter_slidable, flutter_markdown, file_picker, equatable,
image_picker, speech_to_text
```

### Needed for v2.1+
```yaml
flutter_local_notifications  # Reminders
timezone                    # Timezone-aware scheduling
fl_chart                    # Statistics charts (optional, can use simple widgets)
```

---

> **Next action:** Build Phase A (Execution Core) — reminders, calendar, recurring tasks, sub-tasks.  
> **After that:** Phase B (Journal) — separate journaling module with mood tracking and streaks.
