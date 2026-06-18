import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../providers/notes_provider.dart';
import '../providers/tasks_provider.dart';
import '../providers/projects_provider.dart';
import '../providers/habit_provider.dart';
import '../providers/daily_plan_provider.dart';
import '../providers/energy_provider.dart';
import '../models/note.dart';
import '../models/task.dart';
import '../models/daily_plan.dart';
import '../theme/app_theme.dart';
import 'planning/daily_planning_screen.dart';
import 'focus_timer_screen.dart';
import 'notes/note_editor_screen.dart';
import 'projects/project_detail_screen.dart';
import 'tasks/task_editor_screen.dart';
import 'widgets/empty_state.dart';
import 'widgets/quick_add_sheet.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final projects = context.watch<ProjectsProvider>();
    final habits = context.watch<HabitProvider>();
    final planProvider = context.watch<DailyPlanProvider>();
    final app = context.watch<AppProvider>();
    final plan = planProvider.todayPlan;
    final firstName = app.userName.split(' ').first;
    final inboxCount = tasks.tasks.where((t) => !t.completed && t.isInbox).length;
    final today = tasks.todayTasks;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([tasks.load(), notes.load(), projects.load(), planProvider.load()]);
        },
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
          slivers: [
            SliverAppBar(
              floating: true,
              snap: true,
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
              automaticallyImplyLeading: false,
              expandedHeight: 0,
              flexibleSpace: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 12, 8),
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(_greeting(firstName), style: TextStyle(fontSize: 13, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600, letterSpacing: 0.3)),
                        Text(_dateLine(), style: Theme.of(context).textTheme.headlineMedium),
                      ]),
                    ),
                    IconButton(
                      icon: Icon(isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                      onPressed: () => app.toggleDarkMode(),
                    ),
                  ]),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              sliver: SliverList.list(children: [
                // Hero: planning / MITs / day-won
                _CommandCenter(
                  plan: plan,
                  onPlan: () => _openPlanning(context),
                  onStartMIT: (t) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => FocusTimerScreen(taskTitle: t.title))),
                  onToggleMIT: (id) => tasks.toggle(id),
                ),
                const SizedBox(height: 16),

                // Quick actions row — each tile opens a DISTINCT screen
                _QuickActionRow(
                  onAddTask: () => _openTaskEditor(context),
                  onAddNote: () => _openNoteEditor(context),
                  onPlan: () => _openPlanning(context),
                  onFocus: () => app.setSection(AppSection.focus),
                ),
                const SizedBox(height: 16),

                // Energy check-in
                const _EnergyCheckIn(),
                const SizedBox(height: 16),

                // Today timeline
                _SectionHeader(title: 'Today', count: today.length, onTap: () => app.setSection(AppSection.tasks)),
                const SizedBox(height: 8),
                if (today.isEmpty)
                  EmptyState(
                    icon: Icons.wb_sunny_rounded,
                    title: 'Nothing scheduled',
                    subtitle: 'Add tasks with dates or MITs in your morning plan.',
                    actionLabel: 'Quick add',
                    onAction: () => showQuickAdd(context),
                  )
                else
                  ..._buildTodayTimeline(today, plan?.mitTaskIds ?? [], context),

                const SizedBox(height: 16),
                // Inbox preview
                _SectionHeader(title: 'Inbox', count: inboxCount, onTap: () => app.setSection(AppSection.inbox)),
                const SizedBox(height: 8),
                if (inboxCount == 0)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppTheme.success.withValues(alpha: isDark ? 0.1 : 0.06), borderRadius: BorderRadius.circular(14), border: Border.all(color: AppTheme.success.withValues(alpha: 0.2))),
                    child: Row(children: [
                      const Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 18),
                      const SizedBox(width: 8),
                      Text('Inbox zero.', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.success)),
                      const SizedBox(width: 4),
                      Text('Tidy mind.', style: TextStyle(fontSize: 13, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
                    ]),
                  )
                else
                  ...tasks.tasks.where((t) => !t.completed && t.isInbox).take(5).map((t) => _TaskRow(task: t, isMIT: false, onToggle: () => tasks.toggle(t.id))),

                const SizedBox(height: 20),
                // Habits
                if (habits.habits.isNotEmpty) ...[
                  _SectionHeader(title: 'Habits', count: habits.habits.length, onTap: () => app.setSection(AppSection.habits)),
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    for (final h in habits.habits)
                      _HabitChip(name: h.name, color: Color(h.color), icon: h.icon, done: habits.isDone(h.id), onTap: () => habits.toggle(h.id)),
                  ]),
                  const SizedBox(height: 16),
                ],

                // Recent notes
                if (notes.notes.isNotEmpty) ...[
                  _SectionHeader(title: 'Recent notes', count: notes.count, onTap: () => app.setSection(AppSection.notes)),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 130,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: notes.notes.take(8).length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (_, i) => _NoteCard(note: notes.notes[i]),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Projects
                if (projects.projects.isNotEmpty) ...[
                  _SectionHeader(title: 'Projects', count: projects.projects.length, onTap: () => app.setSection(AppSection.projects)),
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    for (final p in projects.projects.take(10))
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => ProjectDetailScreen(projectId: p.id), fullscreenDialog: true),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(color: Color(p.color).withValues(alpha: isDark ? 0.16 : 0.10), borderRadius: BorderRadius.circular(18), border: Border.all(color: Color(p.color).withValues(alpha: 0.3))),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Icon(Icons.folder_rounded, size: 13, color: Color(p.color)),
                            const SizedBox(width: 5),
                            Text(p.name, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(p.color))),
                          ]),
                        ),
                      ),
                  ]),
                ],
              ]),
            ),
          ],
        ),
      ),
    );
  }

  String _greeting(String name) {
    final h = DateTime.now().hour;
    final g = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    if (name.isEmpty) return g;
    return '$g, $name';
  }

  String _dateLine() => DateFormat('EEEE, MMM d').format(DateTime.now());

  Future<void> _openPlanning(BuildContext context) async {
    HapticFeedback.lightImpact();
    final result = await Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => const DailyPlanningScreen(), fullscreenDialog: true));
    if (result == true && context.mounted) await context.read<DailyPlanProvider>().load();
  }

  Future<void> _openTaskEditor(BuildContext context) async {
    HapticFeedback.lightImpact();
    await Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => const TaskEditorScreen(), fullscreenDialog: true));
  }

  Future<void> _openNoteEditor(BuildContext context) async {
    HapticFeedback.lightImpact();
    await Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(builder: (_) => const NoteEditorScreen(), fullscreenDialog: true));
  }

  Future<void> _openSection(BuildContext context, AppSection section) async {
    HapticFeedback.selectionClick();
    context.read<AppProvider>().setSection(section);
  }

  /// Group today's tasks by time-block and render a vertical timeline.
  List<Widget> _buildTodayTimeline(List<Task> tasks, List<String> mitIds, BuildContext context) {
    final sorted = List<Task>.from(tasks)..sort((a, b) {
      final aD = a.dueDate;
      final bD = b.dueDate;
      if (aD == null && bD == null) return 0;
      if (aD == null) return 1;
      if (bD == null) return -1;
      return aD.compareTo(bD);
    });
    return sorted.take(8).map((t) => _TimelineRow(task: t, isMIT: mitIds.contains(t.id), onToggle: () => context.read<TasksProvider>().toggle(t.id))).toList();
  }
}

// ─── Command center ────────────────────────────────────────────────────────
class _CommandCenter extends StatelessWidget {
  final DailyPlan? plan;
  final VoidCallback onPlan;
  final void Function(Task) onStartMIT;
  final void Function(String) onToggleMIT;
  const _CommandCenter({required this.plan, required this.onPlan, required this.onStartMIT, required this.onToggleMIT});

  @override
  Widget build(BuildContext context) {
    if (plan == null || !plan!.morningDone) return _PlanningCTA(onPlan: onPlan);
    final mits = context.watch<TasksProvider>().tasksByIds(plan!.mitTaskIds);
    final done = mits.where((t) => t.completed).length;
    if (mits.isNotEmpty && done == mits.length) return _DayWonCard(done);
    return _MITPanel(plan: plan!, mits: mits, done: done, onPlan: onPlan, onStartMIT: onStartMIT, onToggleMIT: onToggleMIT);
  }
}

class _PlanningCTA extends StatelessWidget {
  final VoidCallback onPlan;
  const _PlanningCTA({required this.onPlan});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () { HapticFeedback.lightImpact(); onPlan(); },
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)), child: const Text('MORNING RITUAL', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.4))),
        const SizedBox(height: 14),
        Text("Plan your day.", style: Theme.of(context).textTheme.displaySmall?.copyWith(color: Colors.white)),
        const SizedBox(height: 6),
        Text("Pick 3 MITs. Protect them. Everything else is a bonus.", style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 14, height: 1.5)),
        const SizedBox(height: 18),
        Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)), child: const Row(mainAxisSize: MainAxisSize.min, children: [Text('Start 60s ritual', style: TextStyle(color: AppTheme.primary, fontSize: 14, fontWeight: FontWeight.w700)), SizedBox(width: 6), Icon(Icons.arrow_forward_rounded, size: 18, color: AppTheme.primary)])),
      ]),
    ),
  );
}

class _DayWonCard extends StatelessWidget {
  final int done;
  const _DayWonCard(this.done);
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [Color(0xFF22C55E), Color(0xFF15803D)], begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(20),
      boxShadow: [BoxShadow(color: Colors.green.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('DAY WON', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
      const SizedBox(height: 6),
      Text("$done MITs complete.", style: Theme.of(context).textTheme.displaySmall?.copyWith(color: Colors.white)),
      const SizedBox(height: 6),
      Text("Nothing else required. Rest or ship a bonus.", style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 14, height: 1.5)),
    ]),
  );
}

class _MITPanel extends StatelessWidget {
  final DailyPlan plan;
  final List<Task> mits;
  final int done;
  final VoidCallback onPlan;
  final void Function(Task) onStartMIT;
  final void Function(String) onToggleMIT;
  const _MITPanel({required this.plan, required this.mits, required this.done, required this.onPlan, required this.onStartMIT, required this.onToggleMIT});
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (plan.intentionText.isNotEmpty) Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.flag_rounded, size: 14, color: AppTheme.primary),
            const SizedBox(width: 6),
            Text("TODAY'S INTENTION", style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
            const Spacer(),
            TextButton.icon(onPressed: onPlan, icon: const Icon(Icons.edit_rounded, size: 14), label: const Text('Edit', style: TextStyle(fontSize: 12)), style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), visualDensity: VisualDensity.compact)),
          ]),
          const SizedBox(height: 4),
          Text(plan.intentionText, style: Theme.of(context).textTheme.titleLarge?.copyWith(height: 1.3)),
        ]),
      ),
      Row(children: [
        Text("YOUR MITs", style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
        const Spacer(),
        Text('$done/${mits.length}', style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w700)),
      ]),
      const SizedBox(height: 8),
      ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: mits.isEmpty ? 0 : done / mits.length, minHeight: 4, backgroundColor: Theme.of(context).dividerColor, valueColor: const AlwaysStoppedAnimation(AppTheme.primary))),
      const SizedBox(height: 12),
      if (mits.isEmpty)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16), border: Border.all(color: Theme.of(context).dividerColor)),
          child: Column(children: [
            Icon(Icons.add_task_rounded, size: 32, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
            const SizedBox(height: 8),
            const Text('No MITs picked.', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text('Open the ritual and choose 3.', style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
            const SizedBox(height: 12),
            FilledButton.tonal(onPressed: onPlan, child: const Text('Pick MITs')),
          ]),
        )
      else
        ...mits.asMap().entries.map((e) => _MITCard(index: e.key, task: e.value, onStart: () => onStartMIT(e.value), onToggle: () => onToggleMIT(e.value.id))),
    ]);
  }
}

class _MITCard extends StatelessWidget {
  final int index;
  final Task task;
  final VoidCallback onStart;
  final VoidCallback onToggle;
  const _MITCard({required this.index, required this.task, required this.onStart, required this.onToggle});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: task.completed ? AppTheme.success.withValues(alpha: 0.4) : Theme.of(context).dividerColor),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          GestureDetector(
            onTap: () { HapticFeedback.selectionClick(); onToggle(); },
            child: Container(
              width: 28, height: 28,
              decoration: BoxDecoration(shape: BoxShape.circle, color: task.completed ? AppTheme.success : AppTheme.primary.withValues(alpha: 0.12), border: Border.all(color: task.completed ? AppTheme.success : AppTheme.primary, width: 1.5)),
              child: task.completed ? const Icon(Icons.check_rounded, color: Colors.white, size: 16) : Center(child: Text('${index + 1}', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 13))),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(task.title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, decoration: task.completed ? TextDecoration.lineThrough : null)),
              if (task.firstStep.isNotEmpty) ...[
                const SizedBox(height: 4),
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.play_arrow_rounded, size: 12, color: AppTheme.primary),
                  const SizedBox(width: 3),
                  Expanded(child: Text(task.firstStep, style: TextStyle(fontSize: 12, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontStyle: FontStyle.italic, height: 1.4))),
                ]),
              ],
            ]),
          ),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          _SmallChip(icon: task.energyIcon, label: task.energyLabel, color: task.energyColor),
          if (task.estimatedMinutes != null) ...[const SizedBox(width: 4), _SmallChip(icon: Icons.timer_outlined, label: task.estimatedLabel, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)],
          const Spacer(),
          if (!task.completed) FilledButton.tonalIcon(onPressed: onStart, style: FilledButton.styleFrom(visualDensity: VisualDensity.compact, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))), icon: const Icon(Icons.play_arrow_rounded, size: 14), label: const Text('Focus', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12))),
        ]),
      ]),
    );
  }
}

class _SmallChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _SmallChip({required this.icon, required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(6)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 11, color: color), const SizedBox(width: 3), Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700))]),
    );
  }
}

// ─── Quick actions ─────────────────────────────────────────────────────────
class _QuickActionRow extends StatelessWidget {
  final VoidCallback onAddTask;
  final VoidCallback onAddNote;
  final VoidCallback onPlan;
  final VoidCallback onFocus;
  const _QuickActionRow({required this.onAddTask, required this.onAddNote, required this.onPlan, required this.onFocus});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(child: _ActionTile(icon: Icons.add_task_rounded, label: 'Add Task', sublabel: 'Open editor', color: AppTheme.primary, onTap: onAddTask)),
      const SizedBox(width: 8),
      Expanded(child: _ActionTile(icon: Icons.edit_note_rounded, label: 'Add Note', sublabel: 'Open editor', color: AppTheme.energyMedium, onTap: onAddNote)),
      const SizedBox(width: 8),
      Expanded(child: _ActionTile(icon: Icons.flag_rounded, label: 'Plan', sublabel: 'Morning ritual', color: Colors.orange, onTap: onPlan)),
      const SizedBox(width: 8),
      Expanded(child: _ActionTile(icon: Icons.bolt_rounded, label: 'Focus', sublabel: 'Timer session', color: AppTheme.energyDeep, onTap: onFocus)),
    ]);
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final Color color;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.sublabel, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: isDark ? 0.16 : 0.10),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: isDark ? 0.32 : 0.25)),
          ),
          child: Column(children: [
            Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withValues(alpha: 0.20), borderRadius: BorderRadius.circular(10)), child: Icon(icon, color: color, size: 22)),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color, height: 1.1)),
            const SizedBox(height: 2),
            Text(sublabel, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: color.withValues(alpha: 0.7), letterSpacing: 0.2)),
          ]),
        ),
      ),
    );
  }
}

// ─── Energy check-in ───────────────────────────────────────────────────────
class _EnergyCheckIn extends StatelessWidget {
  const _EnergyCheckIn();

  @override
  Widget build(BuildContext context) {
    final energy = context.watch<EnergyProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = [AppTheme.energyAdmin, AppTheme.energyMedium, AppTheme.energyDeep];
    final icons = [Icons.battery_2_bar_rounded, Icons.battery_4_bar_rounded, Icons.battery_full_rounded];
    final labels = ['Low', 'Medium', 'High'];
    final hints = ['Admin & shallow', 'Balanced', 'Deep work time'];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(14)),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: colors[energy.level].withValues(alpha: 0.14), borderRadius: BorderRadius.circular(10)),
          child: Icon(icons[energy.level], color: colors[energy.level], size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(energy.checkedToday ? "Today's energy" : 'How is your energy?', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text(energy.checkedToday ? labels[energy.level] : 'Match tasks to capacity.', style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
          ]),
        ),
        const SizedBox(width: 8),
        Row(mainAxisSize: MainAxisSize.min, children: [
          for (int i = 0; i < 3; i++) Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Semantics(
              button: true, selected: energy.level == i, label: labels[i],
              child: InkWell(
                onTap: () { HapticFeedback.selectionClick(); context.read<EnergyProvider>().setLevel(i); },
                borderRadius: BorderRadius.circular(20),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: energy.level == i ? colors[i] : colors[i].withValues(alpha: 0.10),
                    shape: BoxShape.circle,
                    border: Border.all(color: energy.level == i ? colors[i] : Colors.transparent, width: 2),
                  ),
                  child: Icon(icons[i], color: energy.level == i ? Colors.white : colors[i], size: 18),
                ),
              ),
            ),
          ),
        ]),
      ]),
    );
  }
}

// ─── Timeline row ──────────────────────────────────────────────────────────
class _TimelineRow extends StatelessWidget {
  final Task task;
  final bool isMIT;
  final VoidCallback onToggle;
  const _TimelineRow({required this.task, required this.isMIT, required this.onToggle});
  @override
  Widget build(BuildContext context) {
    final hasTime = task.dueDate != null;
    final timeLabel = hasTime ? DateFormat('h:mm a').format(task.dueDate!) : 'Anytime';
    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SizedBox(
          width: 56,
          child: Padding(
            padding: const EdgeInsets.only(top: 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text(hasTime ? timeLabel.split(' ').first : '—', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: isMIT ? AppTheme.primary : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted))),
              if (hasTime) Text(timeLabel.split(' ').last, style: TextStyle(fontSize: 10, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
            ]),
          ),
        ),
        const SizedBox(width: 8),
        Column(children: [
          Container(
            width: 10, height: 10,
            margin: const EdgeInsets.only(top: 16),
            decoration: BoxDecoration(color: task.completed ? AppTheme.success : (isMIT ? AppTheme.primary : Colors.grey.shade400), shape: BoxShape.circle, border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 2)),
          ),
          Expanded(child: Container(width: 2, color: Theme.of(context).dividerColor)),
        ]),
        const SizedBox(width: 8),
        Expanded(child: Padding(padding: const EdgeInsets.only(bottom: 8), child: _TaskRow(task: task, isMIT: isMIT, onToggle: onToggle))),
      ]),
    );
  }
}

// ─── Task row ──────────────────────────────────────────────────────────────
class _TaskRow extends StatelessWidget {
  final Task task;
  final bool isMIT;
  final VoidCallback onToggle;
  const _TaskRow({required this.task, required this.isMIT, required this.onToggle});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { HapticFeedback.selectionClick(); onToggle(); },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isMIT ? AppTheme.primary.withValues(alpha: 0.35) : Theme.of(context).dividerColor),
        ),
        child: Row(children: [
          Container(
            width: 20, height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: task.completed ? AppTheme.success : Colors.transparent,
              border: Border.all(color: task.completed ? AppTheme.success : Theme.of(context).dividerColor, width: 2),
            ),
            child: task.completed ? const Icon(Icons.check_rounded, color: Colors.white, size: 12) : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(task.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: isMIT ? FontWeight.w700 : FontWeight.w500, decoration: task.completed ? TextDecoration.lineThrough : null)),
          ),
          if (isMIT) Container(padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2), margin: const EdgeInsets.only(left: 6), decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(4)), child: const Text('MIT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5))),
          const SizedBox(width: 4),
          Icon(task.energyIcon, size: 13, color: task.energyColor),
        ]),
      ),
    );
  }
}

// ─── Habit chip ────────────────────────────────────────────────────────────
class _HabitChip extends StatelessWidget {
  final String name;
  final Color color;
  final IconData icon;
  final bool done;
  final VoidCallback onTap;
  const _HabitChip({required this.name, required this.color, required this.icon, required this.done, required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: done ? color : color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(18), border: Border.all(color: done ? color : color.withValues(alpha: 0.4))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 13, color: done ? Colors.white : color), const SizedBox(width: 5), Text(name, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: done ? Colors.white : color))]),
    ),
  );
}

// ─── Note card ─────────────────────────────────────────────────────────────
class _NoteCard extends StatelessWidget {
  final Note note;
  const _NoteCard({required this.note});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          HapticFeedback.selectionClick();
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => NoteEditorScreen(noteId: note.id), fullscreenDialog: true),
          );
        },
        child: Container(
          width: 180,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Color(note.color).withValues(alpha: isDark ? 0.14 : 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Color(note.color).withValues(alpha: 0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: Color(note.color), shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Expanded(child: Text(note.title.isEmpty ? 'Untitled' : note.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800))),
            ]),
            const Spacer(),
            if (note.content.isNotEmpty) Text(note.content, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, height: 1.4)),
            const SizedBox(height: 6),
            Text(DateFormat('MMM d').format(note.updatedAt), style: TextStyle(fontSize: 10, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
    );
  }
}

// ─── Section header ────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;
  final VoidCallback onTap;
  const _SectionHeader({required this.title, required this.count, required this.onTap});
  @override
  Widget build(BuildContext context) => Row(children: [
    Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
    const SizedBox(width: 6),
    Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1), decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(8)), child: Text('$count', style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w800))),
    const Spacer(),
    TextButton(onPressed: onTap, child: const Text('See all', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
  ]);
}
