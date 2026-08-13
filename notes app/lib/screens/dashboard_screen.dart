import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
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
import 'tasks/task_editor_screen.dart';
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
              floating: true, snap: true,
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
              automaticallyImplyLeading: false,
              expandedHeight: 80,
              flexibleSpace: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 12, 4),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(_greeting(firstName), style: TextStyle(fontSize: 12, fontFamily: 'Inter', fontWeight: FontWeight.w600, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 0.3)),
                        const SizedBox(height: 2),
                        Text(firstName.isEmpty ? "What's on your mind?" : "What's on your mind, $firstName?", style: TextStyle(fontSize: 22, fontFamily: 'Inter', fontWeight: FontWeight.w800, color: isDark ? AppTheme.darkText : AppTheme.lightText, letterSpacing: -0.5)),
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
                const SizedBox(height: 4),

                // ── Persistent capture ──
                _CaptureBar(
                  onCapture: (text) => _quickCapture(context, text),
                  onOpenAdd: () => showQuickAdd(context),
                ),
                const SizedBox(height: 16),

                // ── Stats strip ──
                _StatStrip(inboxCount: inboxCount, completedToday: tasks.tasks.where((t) => t.completed).length, habitDone: habits.todayStatus.values.where((v) => v).length, habitTotal: habits.habits.length),
                const SizedBox(height: 20),

                // ── Hero: planning / MITs / day-won ──
                _CommandCenter(plan: plan, onPlan: () => _openPlanning(context), onStartMIT: (t) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => FocusTimerScreen(taskTitle: t.title))), onToggleMIT: (id) => tasks.toggle(id)),
                const SizedBox(height: 20),

                // ── Quick actions ──
                _QuickActionRow(onAddTask: () => _openTaskEditor(context), onAddNote: () => _openNoteEditor(context), onPlan: () => _openPlanning(context), onFocus: () => app.setSection(AppSection.focus)),
                const SizedBox(height: 20),

                // ── Energy ──
                const _EnergyCheckIn(),
                const SizedBox(height: 20),

                // ── Today tasks ──
                _SectionHeader(title: 'Today', count: today.length, onTap: () => app.setSection(AppSection.tasks)),
                const SizedBox(height: 8),
                if (today.isEmpty)
                  _GlassCard(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(children: [
                        Icon(Icons.wb_sunny_rounded, size: 32, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                        const SizedBox(height: 8),
                        Text('Nothing scheduled', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkText : AppTheme.lightText)),
                        const SizedBox(height: 4),
                        Text('Add tasks with dates or MITs in your morning plan.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
                      ]),
                    ),
                  )
                else
                  ..._buildTodayTimeline(today, plan?.mitTaskIds ?? [], context),

                const SizedBox(height: 20),
                // Inbox preview
                _SectionHeader(title: 'Inbox', count: inboxCount, onTap: () => app.setSection(AppSection.inbox)),
                const SizedBox(height: 8),
                if (inboxCount == 0)
                  _GlassCard(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(children: [
                        Container(width: 32, height: 32, decoration: BoxDecoration(color: AppTheme.success.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 18)),
                        const SizedBox(width: 10),
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('Inbox zero', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkText : AppTheme.lightText)),
                          Text('Tidy mind.', style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
                        ]),
                      ]),
                    ),
                  )
                else
                  ...tasks.tasks.where((t) => !t.completed && t.isInbox).take(5).map((t) => _TaskRow(task: t, isMIT: false, onToggle: () => tasks.toggle(t.id))),

                const SizedBox(height: 24),

                // ── Bento bottom: Habits + Notes ──
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  if (habits.habits.isNotEmpty)
                    Expanded(
                      child: _GlassCard(
                        margin: const EdgeInsets.only(right: 8),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _SectionHeader(title: 'Rituals', count: habits.habits.length, onTap: () => app.setSection(AppSection.habits), compact: true),
                          const SizedBox(height: 6),
                          ...habits.habits.take(4).map((h) => _HabitChip(name: h.name, color: Color(h.color), icon: h.icon, done: habits.isDone(h.id), onTap: () => habits.toggle(h.id))),
                        ]),
                      ),
                    ),
                  if (notes.notes.isNotEmpty)
                    Expanded(
                      child: _GlassCard(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _SectionHeader(title: 'Thoughts', count: notes.count, onTap: () => app.setSection(AppSection.notes), compact: true),
                          const SizedBox(height: 6),
                          ...notes.notes.take(3).map((n) => _NoteRow(note: n)),
                        ]),
                      ),
                    ),
                ]),
                const SizedBox(height: 20),

                // ── Projects ──
                if (projects.projects.isNotEmpty) ...[
                  _SectionHeader(title: 'Projects', count: projects.projects.length, onTap: () => app.setSection(AppSection.projects)),
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    for (final p in projects.projects.take(8))
                      _ProjectChip(project: p),
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
    return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

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

  Future<void> _quickCapture(BuildContext context, String text) async {
    if (text.trim().isEmpty) return;
    HapticFeedback.lightImpact();
    await showQuickAdd(context);
  }

  List<Widget> _buildTodayTimeline(List<Task> tasks, List<String> mitIds, BuildContext context) {
    final sorted = List<Task>.from(tasks)..sort((a, b) {
      final aD = a.dueDate, bD = b.dueDate;
      if (aD == null && bD == null) return 0;
      if (aD == null) return 1;
      if (bD == null) return -1;
      return aD.compareTo(bD);
    });
    return sorted.take(8).map((t) => Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: _TaskRow(task: t, isMIT: mitIds.contains(t.id), onToggle: () => context.read<TasksProvider>().toggle(t.id)),
    )).toList();
  }
}

// ─── Glass card wrapper ────────────────────────────────────────────────────
class _GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? margin;
  const _GlassCard({required this.child, this.margin});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: margin,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A28).withValues(alpha: 0.72) : const Color(0xFFFFFFFF).withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0x0D000000)),
        boxShadow: [BoxShadow(color: isDark ? Colors.black26 : const Color(0x0A000000), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: child,
    );
  }
}

// ─── Capture bar ────────────────────────────────────────────────────────────
class _CaptureBar extends StatefulWidget {
  final void Function(String) onCapture;
  final VoidCallback onOpenAdd;
  const _CaptureBar({required this.onCapture, required this.onOpenAdd});
  @override State<_CaptureBar> createState() => _CaptureBarState();
}

class _CaptureBarState extends State<_CaptureBar> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();

  @override void dispose() { _ctrl.dispose(); _focus.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A28).withValues(alpha: 0.88) : const Color(0xFFFFFFFF).withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.15)),
        boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.06), blurRadius: 20, offset: const Offset(0, 4))],
      ),
      child: Row(children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(left: 4),
            child: TextField(
              controller: _ctrl, focusNode: _focus,
              textCapitalization: TextCapitalization.sentences,
              style: TextStyle(fontSize: 15, color: isDark ? AppTheme.darkText : AppTheme.lightText, fontWeight: FontWeight.w500),
              decoration: InputDecoration(
                hintText: "Type naturally — we'll figure out the details",
                hintStyle: TextStyle(color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextSubtle, fontSize: 14),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                isDense: true,
              ),
              onSubmitted: (v) { widget.onCapture(v); _ctrl.clear(); },
            ),
          ),
        ),
        SizedBox(
          width: 44, height: 44,
          child: IconButton(
            icon: const Icon(Icons.add_rounded, size: 22),
            onPressed: () { _ctrl.text.trim().isNotEmpty ? widget.onCapture(_ctrl.text.trim()) : widget.onOpenAdd(); _ctrl.clear(); },
            color: AppTheme.primary,
          ),
        ),
        const SizedBox(width: 4),
      ]),
    );
  }
}

// ─── Stat strip ─────────────────────────────────────────────────────────────
class _StatStrip extends StatelessWidget {
  final int inboxCount, completedToday, habitDone, habitTotal;
  const _StatStrip({required this.inboxCount, required this.completedToday, required this.habitDone, required this.habitTotal});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      _StatItem(label: 'Inbox', value: '$inboxCount', color: inboxCount > 5 ? AppTheme.warning : AppTheme.primary),
      _StatItem(label: 'Done', value: '$completedToday', color: AppTheme.success),
      _StatItem(label: 'Habits', value: '$habitDone/$habitTotal', color: AppTheme.energyMedium),
      _StatItem(label: 'Momentum', value: '—', color: AppTheme.energyDeep),
    ]);
  }
}

class _StatItem extends StatelessWidget {
  final String label, value;
  final Color color;
  const _StatItem({required this.label, required this.value, required this.color});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A28).withValues(alpha: 0.55) : const Color(0xFFFFFFFF).withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? Colors.white10 : const Color(0x0D000000)),
        ),
        child: Column(children: [
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, height: 1, color: color)),
          const SizedBox(height: 3),
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 0.3)),
        ]),
      ),
    );
  }
}

// ─── Command center ─────────────────────────────────────────────────────────
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
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 10))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(20)),
          child: const Text('MORNING RITUAL', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
        ),
        const SizedBox(height: 16),
        Text('What deserves your', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white, height: 1.2)),
        Text('attention today?', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white, height: 1.2)),
        const SizedBox(height: 8),
        Text('Pick 3 MITs. Protect them. Everything else is a bonus.', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 14, height: 1.5)),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
          child: const Row(mainAxisSize: MainAxisSize.min, children: [
            Text('Start your plan', style: TextStyle(color: AppTheme.primary, fontSize: 15, fontWeight: FontWeight.w700)),
            SizedBox(width: 8), Icon(Icons.arrow_forward_rounded, size: 20, color: AppTheme.primary),
          ]),
        ),
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
    padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [Color(0xFF22C55E), Color(0xFF15803D)], begin: Alignment.topLeft, end: Alignment.bottomRight),
      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      boxShadow: [BoxShadow(color: const Color(0xFF22C55E).withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 10))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(20)),
        child: const Text('DAY WON', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
      ),
      const SizedBox(height: 16),
      Text('You shipped it all.', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: Colors.white, height: 1.2)),
      const SizedBox(height: 8),
      Text('$done MITs complete. Rest earned.', style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 14, height: 1.5)),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (plan.intentionText.isNotEmpty)
        _GlassCard(
          margin: const EdgeInsets.only(bottom: 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.flag_rounded, size: 14, color: AppTheme.primary),
              const SizedBox(width: 6),
              Text('TODAY\'S INTENTION', style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
            ]),
            const SizedBox(height: 6),
            Text(plan.intentionText, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkText : AppTheme.lightText, height: 1.3)),
          ]),
        ),
      Row(children: [
        Text('PRIORITIES', style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
        const Spacer(),
        Text('$done/${mits.length}', style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w700)),
      ]),
      const SizedBox(height: 6),
      ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: mits.isEmpty ? 0 : done / mits.length, minHeight: 4, backgroundColor: Theme.of(context).dividerColor, valueColor: const AlwaysStoppedAnimation(AppTheme.primary))),
      const SizedBox(height: 12),
      if (mits.isEmpty)
        _GlassCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              Icon(Icons.add_task_rounded, size: 32, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
              const SizedBox(height: 8),
              Text('Pick 1–3 things that matter', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkText : AppTheme.lightText)),
              const SizedBox(height: 12),
              FilledButton.tonal(onPressed: onPlan, child: const Text('Plan your day')),
            ]),
          ),
        )
      else
        ...mits.asMap().entries.map((e) => _MITCard(index: e.key, task: e.value, onStart: () => onStartMIT(e.value), onToggle: () => onToggleMIT(e.value.id))),
    ]);
  }
}

class _MITCard extends StatelessWidget {
  final int index; final Task task; final VoidCallback onStart, onToggle;
  const _MITCard({required this.index, required this.task, required this.onStart, required this.onToggle});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A28).withValues(alpha: 0.72) : const Color(0xFFFFFFFF).withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: task.completed ? AppTheme.success.withValues(alpha: 0.3) : AppTheme.primary.withValues(alpha: 0.15)),
        boxShadow: [BoxShadow(color: isDark ? Colors.black26 : const Color(0x0A000000), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          GestureDetector(
            onTap: () { HapticFeedback.selectionClick(); onToggle(); },
            child: Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: task.completed ? AppTheme.success : AppTheme.primary.withValues(alpha: 0.12),
                border: Border.all(color: task.completed ? AppTheme.success : AppTheme.primary, width: 1.5),
              ),
              child: task.completed ? const Icon(Icons.check_rounded, color: Colors.white, size: 16) : Center(child: Text('${index + 1}', style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 13))),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(task.title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, decoration: task.completed ? TextDecoration.lineThrough : null, color: isDark ? AppTheme.darkText : AppTheme.lightText)),
              if (task.firstStep.isNotEmpty) ...[const SizedBox(height: 4),
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Icon(Icons.play_arrow_rounded, size: 12, color: AppTheme.primary),
                  const SizedBox(width: 3),
                  Expanded(child: Text(task.firstStep, style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontStyle: FontStyle.italic, height: 1.4))),
                ]),
              ],
            ]),
          ),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          _SmallChip(icon: task.energyIcon, label: task.energyLabel, color: task.energyColor),
          if (task.estimatedMinutes != null) ...[const SizedBox(width: 4), _SmallChip(icon: Icons.timer_outlined, label: task.estimatedLabel, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)],
          const Spacer(),
          if (!task.completed) FilledButton.tonalIcon(onPressed: onStart, style: FilledButton.styleFrom(visualDensity: VisualDensity.compact, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), icon: const Icon(Icons.play_arrow_rounded, size: 14), label: const Text('Focus', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12))),
        ]),
      ]),
    );
  }
}

class _SmallChip extends StatelessWidget {
  final IconData icon; final String label; final Color color;
  const _SmallChip({required this.icon, required this.label, required this.color});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(6)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 11, color: color), const SizedBox(width: 3), Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w700))]),
  );
}

// ─── Quick actions ─────────────────────────────────────────────────────────
class _QuickActionRow extends StatelessWidget {
  final VoidCallback onAddTask, onAddNote, onPlan, onFocus;
  const _QuickActionRow({required this.onAddTask, required this.onAddNote, required this.onPlan, required this.onFocus});
  @override
  Widget build(BuildContext context) => Row(children: [
    Expanded(child: _ActionTile(icon: Icons.add_task_rounded, label: 'Task', color: AppTheme.primary, onTap: onAddTask)),
    const SizedBox(width: 8),
    Expanded(child: _ActionTile(icon: Icons.edit_note_rounded, label: 'Note', color: AppTheme.energyMedium, onTap: onAddNote)),
    const SizedBox(width: 8),
    Expanded(child: _ActionTile(icon: Icons.flag_rounded, label: 'Plan', color: Colors.amber, onTap: onPlan)),
    const SizedBox(width: 8),
    Expanded(child: _ActionTile(icon: Icons.bolt_rounded, label: 'Focus', color: AppTheme.energyDeep, onTap: onFocus)),
  ]);
}

class _ActionTile extends StatelessWidget {
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(14), child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(color: color.withValues(alpha: isDark ? 0.12 : 0.06), borderRadius: BorderRadius.circular(14), border: Border.all(color: color.withValues(alpha: 0.2))),
        child: Column(children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color)),
        ]),
      )),
    );
  }
}

// ─── Energy check-in ────────────────────────────────────────────────────────
class _EnergyCheckIn extends StatelessWidget {
  const _EnergyCheckIn();
  @override
  Widget build(BuildContext context) {
    final energy = context.watch<EnergyProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = [AppTheme.energyAdmin, AppTheme.energyMedium, AppTheme.energyDeep];
    final icons = [Icons.battery_2_bar_rounded, Icons.battery_4_bar_rounded, Icons.battery_full_rounded];
    final labels = ['Admin', 'Medium', 'Deep'];

    return _GlassCard(
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: colors[energy.level].withValues(alpha: 0.14), borderRadius: BorderRadius.circular(10)),
          child: Icon(icons[energy.level], color: colors[energy.level], size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(energy.checkedToday ? 'Today\'s energy' : 'How\'s your energy?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkText : AppTheme.lightText)),
          const SizedBox(height: 2),
          Text(energy.checkedToday ? labels[energy.level] : 'Match tasks to how you feel', style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
        ])),
        const SizedBox(width: 8),
        Row(mainAxisSize: MainAxisSize.min, children: [
          for (int i = 0; i < 3; i++) Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Semantics(button: true, selected: energy.level == i, label: labels[i], child: InkWell(
              onTap: () { HapticFeedback.selectionClick(); context.read<EnergyProvider>().setLevel(i); },
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 38, height: 38,
                decoration: BoxDecoration(
                  color: energy.level == i ? colors[i] : colors[i].withValues(alpha: 0.10),
                  shape: BoxShape.circle,
                  border: Border.all(color: energy.level == i ? colors[i] : Colors.transparent, width: 2),
                ),
                child: Icon(icons[i], color: energy.level == i ? Colors.white : colors[i], size: 16),
              ),
            )),
          ),
        ]),
      ]),
    );
  }
}

// ─── Task row ───────────────────────────────────────────────────────────────
class _TaskRow extends StatelessWidget {
  final Task task; final bool isMIT; final VoidCallback onToggle;
  const _TaskRow({required this.task, required this.isMIT, required this.onToggle});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () { HapticFeedback.selectionClick(); onToggle(); },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A28).withValues(alpha: 0.55) : const Color(0xFFFFFFFF).withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isMIT ? AppTheme.primary.withValues(alpha: 0.3) : isDark ? Colors.white10 : const Color(0x0F000000)),
        ),
        child: Row(children: [
          Container(
            width: 20, height: 20,
            decoration: BoxDecoration(shape: BoxShape.circle, color: task.completed ? AppTheme.success : Colors.transparent, border: Border.all(color: task.completed ? AppTheme.success : isDark ? AppTheme.darkBorder : AppTheme.lightBorder, width: 2)),
            child: task.completed ? const Icon(Icons.check_rounded, color: Colors.white, size: 12) : null,
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(task.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: isMIT ? FontWeight.w700 : FontWeight.w500, decoration: task.completed ? TextDecoration.lineThrough : null, color: isDark ? AppTheme.darkText : AppTheme.lightText))),
          if (isMIT) Container(padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2), margin: const EdgeInsets.only(left: 6), decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4)), child: const Text('MIT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppTheme.primary, letterSpacing: 0.5))),
          const SizedBox(width: 4),
          Icon(task.energyIcon, size: 14, color: task.energyColor),
        ]),
      ),
    );
  }
}

// ─── Habit chip ─────────────────────────────────────────────────────────────
class _HabitChip extends StatelessWidget {
  final String name; final Color color; final IconData icon; final bool done; final VoidCallback onTap;
  const _HabitChip({required this.name, required this.color, required this.icon, required this.done, required this.onTap});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(color: done ? color.withValues(alpha: 0.15) : color.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(10)),
        child: Row(children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 8),
          Expanded(child: Text(name, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: done ? color : Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText, decoration: done ? TextDecoration.lineThrough : null))),
          if (done) Icon(Icons.check_circle_rounded, size: 16, color: color),
        ]),
      ),
    ),
  );
}

// ─── Note row ───────────────────────────────────────────────────────────────
class _NoteRow extends StatelessWidget {
  final Note note;
  const _NoteRow({required this.note});
  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () { HapticFeedback.selectionClick(); Navigator.of(context).push(MaterialPageRoute(builder: (_) => NoteEditorScreen(noteId: note.id), fullscreenDialog: true)); },
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(children: [
              Container(width: 3, height: 28, decoration: BoxDecoration(color: Color(note.color), borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 8),
              Expanded(child: Text(note.title.isEmpty ? 'Untitled' : note.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? AppTheme.darkText : AppTheme.lightText))),
              const SizedBox(width: 4),
              Icon(Icons.chevron_right_rounded, size: 16, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
            ]),
          ),
        ),
      ),
    );
  }
}

// ─── Project chip ──────────────────────────────────────────────────────────
class _ProjectChip extends StatelessWidget {
  final dynamic project;
  const _ProjectChip({required this.project});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () { HapticFeedback.selectionClick(); },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: Color(project.color).withValues(alpha: 0.10), borderRadius: BorderRadius.circular(12), border: Border.all(color: Color(project.color).withValues(alpha: 0.25))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.folder_rounded, size: 13, color: Color(project.color)),
        const SizedBox(width: 5),
        Text(project.name, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(project.color))),
      ]),
    ),
  );
}

// ─── Section header ─────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title; final int count; final VoidCallback onTap; final bool compact;
  const _SectionHeader({required this.title, required this.count, required this.onTap, this.compact = false});
  @override
  Widget build(BuildContext context) => Row(children: [
    Text(title, style: TextStyle(fontSize: compact ? 13 : 15, fontWeight: FontWeight.w800, letterSpacing: -0.2, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText)),
    const SizedBox(width: 6),
    Container(padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1), decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)), child: Text('$count', style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w800))),
    const Spacer(),
    if (!compact) TextButton(onPressed: onTap, child: const Text('See all', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
    if (compact) GestureDetector(onTap: onTap, child: const Icon(Icons.arrow_forward_rounded, size: 16, color: AppTheme.primary)),
  ]);
}
