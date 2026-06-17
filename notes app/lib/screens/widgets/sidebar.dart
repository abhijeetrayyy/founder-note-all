import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/notes_provider.dart';
import '../../providers/habit_provider.dart';
import '../../providers/daily_plan_provider.dart';
import '../../theme/app_theme.dart';

class Sidebar extends StatelessWidget {
  const Sidebar({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final collapsed = !app.sidebarOpen;
    final bg = isDark ? AppTheme.darkSidebar : AppTheme.lightSidebar;
    final plan = context.watch<DailyPlanProvider>();
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final habits = context.watch<HabitProvider>();

    return Container(
      color: bg,
      child: Column(
        children: [
          _Header(collapsed: collapsed, onToggle: app.toggleSidebar, isDark: isDark),
          const SizedBox(height: 8),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _Group(collapsed: collapsed, title: 'FOCUS', items: const [
                  (AppSection.dashboard, Icons.wb_sunny_rounded, 'Today', 'dashboard'),
                  (AppSection.inbox, Icons.inbox_rounded, 'Inbox', 'inbox'),
                  (AppSection.planning, Icons.flag_rounded, 'Daily Plan', 'plan'),
                ], badges: {
                  'inbox': tasks.tasks.where((t) => !t.completed && t.isInbox).length,
                  'plan': plan.hasPlannedToday ? 0 : 1,
                }),
                const SizedBox(height: 10),
                _Group(collapsed: collapsed, title: 'CAPTURE', items: const [
                  (AppSection.tasks, Icons.checklist_rounded, 'Tasks', 'tasks'),
                  (AppSection.notes, Icons.notes_rounded, 'Notes', 'notes'),
                  (AppSection.projects, Icons.folder_rounded, 'Projects', 'projects'),
                ], badges: {
                  'tasks': tasks.activeCount,
                  'notes': notes.count,
                }),
                const SizedBox(height: 10),
                _Group(collapsed: collapsed, title: 'TRACK', items: const [
                  (AppSection.goals, Icons.track_changes_rounded, 'Goals', 'goals'),
                  (AppSection.calendar, Icons.calendar_today_rounded, 'Calendar', null),
                  (AppSection.habits, Icons.auto_awesome_rounded, 'Habits', 'habits'),
                  (AppSection.journal, Icons.edit_note_rounded, 'Journal', 'journal'),
                ], badges: {
                  'habits': habits.habits.length,
                }),
                const SizedBox(height: 10),
                _Group(collapsed: collapsed, title: 'REFLECT', items: const [
                  (AppSection.stats, Icons.insights_rounded, 'Statistics', null),
                  (AppSection.review, Icons.psychology_rounded, 'Weekly Review', null),
                  (AppSection.focus, Icons.timer_rounded, 'Focus Timer', null),
                ], badges: const {}),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(8),
            child: _NavItem(icon: Icons.settings_rounded, label: 'Settings', index: AppSection.values.indexOf(AppSection.settings), collapsed: collapsed),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final bool collapsed;
  final VoidCallback onToggle;
  final bool isDark;
  const _Header({required this.collapsed, required this.onToggle, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(collapsed ? 12 : 16, 18, 12, 18),
      child: Row(children: [
        Container(width: 38, height: 38, decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep]), borderRadius: BorderRadius.circular(11)), child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 20)),
        if (!collapsed) ...[
          const SizedBox(width: 12),
          const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [Text('Founder', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: -0.3)), Text('Execution OS', style: TextStyle(fontSize: 11, color: AppTheme.lightTextMuted, fontWeight: FontWeight.w500))])),
          IconButton(icon: Icon(Icons.menu_open_rounded, size: 20, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted), onPressed: onToggle, padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
        ]
        else
          IconButton(icon: Icon(Icons.menu_rounded, size: 20, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted), onPressed: onToggle, padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
      ]),
    );
  }
}

class _Group extends StatelessWidget {
  final bool collapsed;
  final String title;
  final List<(AppSection, IconData, String, String?)> items;
  final Map<String, int> badges;
  const _Group({required this.collapsed, required this.title, required this.items, required this.badges});

  @override
  Widget build(BuildContext context) {
    if (collapsed) {
      return Column(children: [for (final it in items) Padding(padding: const EdgeInsets.only(bottom: 2), child: _NavItem(icon: it.$2, label: it.$3, index: AppSection.values.indexOf(it.$1), collapsed: true, badgeKey: it.$4, badges: badges))]);
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.fromLTRB(12, 0, 12, 8), child: Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 1.4))),
      for (final it in items) _NavItem(icon: it.$2, label: it.$3, index: AppSection.values.indexOf(it.$1), collapsed: false, badgeKey: it.$4, badges: badges),
    ]);
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final int index;
  final bool collapsed;
  final String? badgeKey;
  final Map<String, int> badges;
  const _NavItem({required this.icon, required this.label, required this.index, required this.collapsed, this.badgeKey, this.badges = const {}});

  int? get _badge => badgeKey == null ? null : badges[badgeKey];
  bool get _showDot => badgeKey == 'plan' && (_badge ?? 0) > 0;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final active = app.sidebarIndex == index;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = active ? AppTheme.primary : (isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted);
    final bg = active ? (isDark ? AppTheme.primary.withValues(alpha: 0.18) : AppTheme.primary.withValues(alpha: 0.10)) : Colors.transparent;
    final showBadge = !_showDot && (_badge != null) && _badge! > 0;
    final badgeText = _badge == null ? '' : '$_badge';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => app.setSidebarIndex(index),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: collapsed ? 0 : 12, vertical: 10),
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
            child: collapsed
                ? Center(
                    child: Stack(clipBehavior: Clip.none, children: [
                      Container(width: 36, height: 36, decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), color: active ? AppTheme.primary.withValues(alpha: 0.15) : Colors.transparent), child: Icon(icon, size: 20, color: color)),
                      if (_showDot)
                        Positioned(right: 0, top: 0, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppTheme.warning, shape: BoxShape.circle))),
                    ]),
                  )
                : Row(children: [
                    Icon(icon, size: 18, color: color),
                    const SizedBox(width: 12),
                    Expanded(child: Text(label, style: TextStyle(fontSize: 14, fontWeight: active ? FontWeight.w700 : FontWeight.w500, color: isDark ? AppTheme.darkText : AppTheme.lightText))),
                    if (showBadge)
                      Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2), decoration: BoxDecoration(color: active ? AppTheme.primary : (isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt), borderRadius: BorderRadius.circular(10)), child: Text(badgeText, style: TextStyle(color: active ? Colors.white : (isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted), fontSize: 11, fontWeight: FontWeight.w700))),
                    if (_showDot)
                      Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppTheme.warning, shape: BoxShape.circle)),
                  ]),
          ),
        ),
      ),
    );
  }
}
