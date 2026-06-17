# FounderOS — Setup & Run Guide

This workspace contains the FounderOS founder execution system across two codebases:

- `notes app/` — Flutter mobile app (offline-first SQLite + Supabase cloud sync)
- `founder-web/` — Next.js 15 web app (server-rendered, Supabase-backed)
- `supabase/schema.sql` — complete database schema, RLS, indexes, triggers, and helper functions

## 1. Supabase project

1. Create a new Supabase project at https://supabase.com.
2. Open the SQL Editor and run the entire contents of `supabase/schema.sql`.
3. Go to Project Settings → API and copy:
   - `URL`
   - `anon public` key
   - `service_role` key (for server-side admin operations only)

## 2. Web app (`founder-web/`)

### Environment variables

Create `founder-web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Run locally

```bash
cd "founder-web"
npm install
npm run dev
```

Open http://localhost:3000.

### Build

```bash
npm run typecheck
npm run build
npm start
```

## 3. Mobile app (`notes app/`)

### Configure Supabase

Edit `lib/config/supabase_config.dart` or pass values at build time:

```bash
flutter build apk --debug \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

### Run locally

```bash
cd "notes app"
flutter pub get
flutter run
```

### Build debug APK

```bash
flutter build apk --debug
```

Output: `build/app/outputs/flutter-apk/app-debug.apk`

## 4. Features

- **Auth**: email/password signup & sign-in on both platforms, backed by Supabase Auth.
- **Tasks**: capture, prioritize, schedule, energy-tag, and complete tasks.
- **Notes**: pinned, categorized, project-linked notes.
- **Projects**: group tasks and notes by outcome.
- **Goals**: track progress with sliders.
- **Habits**: daily check-ins with logs.
- **Journal**: mood + reflection entries.
- **Daily Planning**: intention, blockers, MITs, energy check-in.
- **Focus Timer**: pomodoro/deep-work/quick-sprint timer.
- **Stats & Review**: weekly metrics and reflection prompts.
- **Quick Add**: natural-language capture (`Call investor tomorrow at 2pm #sales`) on both platforms.

## 5. Cloud sync (mobile)

The mobile app is offline-first. After signing in, go to **Settings → Sync to cloud** to push local SQLite data to Supabase. Pull sync and automatic background sync can be added on top of `lib/services/supabase_sync_service.dart`.

## 6. Common issues

- **Kotlin version errors during Android build**: `android/build.gradle` and `android/settings.gradle` are set to Kotlin `2.2.0` to match the latest `supabase_flutter` transitive dependencies.
- **minSdk error**: `android/app/build.gradle` uses `minSdk 23` because the `passkeys_android` transitive dependency requires it.
- **Supabase types**: the web app currently uses runtime casts against a hand-written `lib/supabase/types.ts`. Regenerate proper types with the Supabase CLI when the schema changes.
