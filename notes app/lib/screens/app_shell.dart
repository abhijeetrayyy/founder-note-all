import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/daily_plan_provider.dart';
import '../providers/tasks_provider.dart';
import '../providers/notes_provider.dart';
import '../providers/habit_provider.dart';
import '../providers/goals_provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import 'widgets/sidebar.dart';
import 'widgets/command_palette.dart';
import 'widgets/quick_add_sheet.dart';
import 'widgets/keyboard_safe.dart';
import 'auth/login_screen.dart';
import 'dashboard_screen.dart';
import 'inbox_screen.dart';
import 'notes/notes_screen.dart';
import 'tasks/tasks_screen.dart';
import 'projects/projects_screen.dart';
import 'settings_screen.dart';
import 'calendar_screen.dart';
import 'journal/journal_screen.dart';
import 'habits/habits_screen.dart';
import 'stats/stats_screen.dart';
import 'review/weekly_review_screen.dart';
import 'focus_timer_screen.dart';
import 'planning/daily_planning_screen.dart';
import 'onboarding_screen.dart';
import 'goals/goals_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  void _showCommandPalette() {
    showDialog(context: context, builder: (_) => const CommandPalette(), barrierColor: Colors.black.withValues(alpha: 0.4));
  }

  Future<void> _showQuickAdd({String? prefill, bool asMIT = false}) async {
    HapticFeedback.lightImpact();
    await showAppSheet(
      context: context,
      builder: (_) => QuickAddSheet(prefill: prefill, defaultToMIT: asMIT),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final auth = context.watch<AuthProvider>();
    if (auth.loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (!auth.isAuthenticated) return const LoginScreen();
    if (!app.onboarded) return const OnboardingScreen();
    final isWide = MediaQuery.of(context).size.width > 800;

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): _showCommandPalette,
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): _showCommandPalette,
        const SingleActivator(LogicalKeyboardKey.keyN, meta: true): () => _showQuickAdd(),
        const SingleActivator(LogicalKeyboardKey.keyN, control: true): () => _showQuickAdd(),
      },
      child: Focus(autofocus: true, child: isWide ? _desktop(app) : _mobile(app)),
    );
  }

  Widget _desktop(AppProvider app) {
    return Scaffold(
      body: Row(children: [
        AnimatedContainer(duration: const Duration(milliseconds: 200), width: app.sidebarOpen ? 264 : 72, child: const Sidebar()),
        const VerticalDivider(width: 1),
        Expanded(child: _buildContent(app)),
      ]),
    );
  }

  Widget _mobile(AppProvider app) {
    final fab = _shouldShowFab(app.section)
        ? FloatingActionButton.extended(
            onPressed: _showQuickAdd,
            icon: const Icon(Icons.add_rounded, size: 22),
            label: const Text('Capture'),
          )
        : null;
    return Scaffold(
      key: _scaffoldKey,
      drawer: const Drawer(child: _MoreMenu()),
      body: SafeArea(top: false, child: _buildContent(app)),
      floatingActionButton: fab,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      bottomNavigationBar: _BottomNav(section: app.section, onChange: (s) => app.setSection(s), onCapture: _showQuickAdd, onMore: () => _scaffoldKey.currentState?.openDrawer()),
    );
  }

  bool _shouldShowFab(AppSection s) => s != AppSection.planning && s != AppSection.focus && s != AppSection.review;

  Widget _buildContent(AppProvider app) {
    switch (app.section) {
      case AppSection.dashboard: return const DashboardScreen();
      case AppSection.tasks: return const TasksScreen();
      case AppSection.notes: return const NotesScreen();
      case AppSection.projects: return const ProjectsScreen();
      case AppSection.settings: return const SettingsScreen();
      case AppSection.calendar: return const CalendarScreen();
      case AppSection.journal: return const JournalScreen();
      case AppSection.habits: return const HabitsScreen();
      case AppSection.stats: return const StatsScreen();
      case AppSection.review: return const WeeklyReviewScreen();
      case AppSection.focus: return const FocusTimerScreen();
      case AppSection.planning: return const DailyPlanningScreen();
      case AppSection.goals: return const GoalsScreen();
      case AppSection.inbox: return const InboxScreen();
    }
  }
}

class _BottomNav extends StatelessWidget {
  final AppSection section;
  final ValueChanged<AppSection> onChange;
  final VoidCallback onCapture;
  final VoidCallback onMore;
  const _BottomNav({required this.section, required this.onChange, required this.onCapture, required this.onMore});

  static const _items = [
    (AppSection.dashboard, Icons.wb_sunny_rounded, 'Today'),
    (AppSection.inbox, Icons.inbox_rounded, 'Inbox'),
    (AppSection.planning, Icons.flag_rounded, 'Plan'),
    (AppSection.stats, Icons.insights_rounded, 'Stats'),
  ];

  @override
  Widget build(BuildContext context) {
    final plan = context.watch<DailyPlanProvider>();
    final tasks = context.watch<TasksProvider>();
    final inboxCount = tasks.tasks.where((t) => !t.completed && t.isInbox).length;
    return Container(
      decoration: BoxDecoration(color: Theme.of(context).cardColor, border: Border(top: BorderSide(color: Theme.of(context).dividerColor))),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 68,
          child: Row(children: [
            for (final (s, icon, label) in _items)
              Expanded(child: _Item(
                icon: icon, label: label, active: section == s,
                badge: s == AppSection.inbox && inboxCount > 0 ? '$inboxCount' : null,
                dot: s == AppSection.planning && !plan.hasPlannedToday,
                onTap: () => onChange(s),
              )),
            // Capture FAB in the middle
            SizedBox(
              width: 64,
              child: GestureDetector(
                onTap: onCapture,
                behavior: HitTestBehavior.opaque,
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep], begin: Alignment.topLeft, end: Alignment.bottomRight), borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.4), blurRadius: 12, offset: const Offset(0, 4))]),
                    child: const Icon(Icons.add_rounded, color: Colors.white, size: 26),
                  ),
                  const SizedBox(height: 4),
                  Text('Capture', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText)),
                ]),
              ),
            ),
            // More (drawer)
            Expanded(child: _Item(icon: Icons.menu_rounded, label: 'More', active: false, onTap: onMore)),
          ]),
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final String? badge;
  final bool dot;
  final VoidCallback onTap;
  const _Item({required this.icon, required this.label, required this.active, this.badge, this.dot = false, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = active ? AppTheme.primary : Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Stack(clipBehavior: Clip.none, children: [
          Icon(icon, color: color, size: 22),
          if (badge != null)
            Positioned(
              right: -8, top: -4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(8)),
                child: Text(badge!, style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
              ),
            ),
          if (dot)
            Positioned(
              right: -4, top: -2,
              child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppTheme.warning, shape: BoxShape.circle)),
            ),
        ]),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: active ? FontWeight.w800 : FontWeight.w500, color: color)),
      ]),
    );
  }
}

/// Mobile "More" menu (drawer) — surfaces all the secondary destinations.
class _MoreMenu extends StatelessWidget {
  const _MoreMenu();
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final habits = context.watch<HabitProvider>();
    final goals = context.watch<GoalsProvider>();
    final plan = context.watch<DailyPlanProvider>();

    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
            child: Row(children: [
              Container(width: 40, height: 40, decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep]), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 22)),
              const SizedBox(width: 12),
              const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Text('Founder', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
                Text('Execution OS', style: TextStyle(fontSize: 12, color: AppTheme.lightTextMuted, fontWeight: FontWeight.w500)),
              ])),
              IconButton(icon: Icon(Icons.close_rounded, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted), onPressed: () => Navigator.pop(context)),
            ]),
          ),
          // Streak card
          Container(
            margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep]), borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              const Icon(Icons.local_fire_department_rounded, color: Colors.white, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${plan.planningStreak} day planning streak', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(plan.planningStreak == 0 ? 'Start your first morning ritual' : 'Keep the chain alive', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12)),
                ]),
              ),
            ]),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _Group(title: 'PLAN', items: [
                  _ItemData(AppSection.goals, Icons.track_changes_rounded, 'Goals', '${goals.count}'),
                  _ItemData(AppSection.calendar, Icons.calendar_today_rounded, 'Calendar', null),
                ]),
                _Group(title: 'TRACK', items: [
                  _ItemData(AppSection.habits, Icons.auto_awesome_rounded, 'Habits', '${habits.habits.length}'),
                  _ItemData(AppSection.journal, Icons.edit_note_rounded, 'Journal', null),
                  _ItemData(AppSection.review, Icons.psychology_rounded, 'Weekly Review', null),
                ]),
                _Group(title: 'CAPTURE', items: [
                  _ItemData(AppSection.tasks, Icons.checklist_rounded, 'Tasks', '${tasks.activeCount}'),
                  _ItemData(AppSection.notes, Icons.notes_rounded, 'Notes', '${notes.count}'),
                  _ItemData(AppSection.projects, Icons.folder_rounded, 'Projects', null),
                ]),
                _Group(title: 'SYSTEM', items: [
                  _ItemData(AppSection.focus, Icons.timer_rounded, 'Focus Timer', null),
                  _ItemData(AppSection.settings, Icons.settings_rounded, 'Settings', null),
                ]),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

class _ItemData {
  final AppSection section;
  final IconData icon;
  final String label;
  final String? badge;
  _ItemData(this.section, this.icon, this.label, this.badge);
}

class _Group extends StatelessWidget {
  final String title;
  final List<_ItemData> items;
  const _Group({required this.title, required this.items});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(padding: const EdgeInsets.fromLTRB(12, 8, 12, 8), child: Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 1.4))),
        for (final it in items) Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () { context.read<AppProvider>().setSection(it.section); Navigator.pop(context); },
            child: Container(
              margin: const EdgeInsets.only(bottom: 2),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Icon(it.icon, size: 18, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText),
                const SizedBox(width: 12),
                Expanded(child: Text(it.label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText))),
                if (it.badge != null) Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2), decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(8)), child: Text(it.badge!, style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w700))),
                const SizedBox(width: 4),
                Icon(Icons.chevron_right_rounded, size: 18, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
              ]),
            ),
          ),
        ),
      ]),
    );
  }
}
