import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/task.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/daily_plan_provider.dart';
import '../../theme/app_theme.dart';
import '../widgets/empty_state.dart';
import '../widgets/quick_add_sheet.dart';
import 'task_editor_screen.dart';

enum _Filter { all, today, upcoming, inbox, mits, completed }

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  _Filter _filter = _Filter.all;
  final _search = TextEditingController();

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<TasksProvider>();
    final plan = context.watch<DailyPlanProvider>().todayPlan;
    final all = p.tasks;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final active = all.where((t) => !t.completed).toList();
    final done = all.where((t) => t.completed).toList();
    final mitIds = plan?.mitTaskIds ?? [];
    final inbox = active.where((t) => t.isInbox).toList();
    final todayList = active.where((t) => t.dueDate == null || t.dueDate!.toIso8601String().substring(0, 10) == today).toList();
    final upcoming = active.where((t) => t.dueDate != null && t.dueDate!.toIso8601String().substring(0, 10) != today).toList()
      ..sort((a, b) => a.dueDate!.compareTo(b.dueDate!));
    final mitList = active.where((t) => mitIds.contains(t.id)).toList();

    List<Task> shown;
    String sectionLabel;
    switch (_filter) {
      case _Filter.today: shown = todayList; sectionLabel = 'Today'; break;
      case _Filter.upcoming: shown = upcoming; sectionLabel = 'Upcoming'; break;
      case _Filter.inbox: shown = inbox; sectionLabel = 'Inbox'; break;
      case _Filter.mits: shown = mitList; sectionLabel = "Today's MITs"; break;
      case _Filter.completed: shown = done; sectionLabel = 'Completed'; break;
      case _Filter.all: shown = active; sectionLabel = 'Active'; break;
    }
    final q = _search.text.trim().toLowerCase();
    if (q.isNotEmpty) shown = shown.where((t) => t.title.toLowerCase().contains(q) || t.description.toLowerCase().contains(q)).toList();

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true, floating: true, backgroundColor: Theme.of(context).scaffoldBackgroundColor, automaticallyImplyLeading: false,
            title: const Text('Tasks', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
            actions: [
              IconButton(icon: const Icon(Icons.search_rounded), onPressed: _showSearch),
              const SizedBox(width: 4),
            ],
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _FilterChip(label: 'All (${active.length})', selected: _filter == _Filter.all, onTap: () => setState(() => _filter = _Filter.all)),
                  _FilterChip(label: 'Today (${todayList.length})', selected: _filter == _Filter.today, onTap: () => setState(() => _filter = _Filter.today)),
                  _FilterChip(label: 'Upcoming (${upcoming.length})', selected: _filter == _Filter.upcoming, onTap: () => setState(() => _filter = _Filter.upcoming)),
                  _FilterChip(label: 'Inbox (${inbox.length})', selected: _filter == _Filter.inbox, onTap: () => setState(() => _filter = _Filter.inbox), dot: inbox.isNotEmpty ? AppTheme.warning : null),
                  _FilterChip(label: 'MITs (${mitList.length})', selected: _filter == _Filter.mits, onTap: () => setState(() => _filter = _Filter.mits), dot: mitList.isNotEmpty ? AppTheme.primary : null),
                  _FilterChip(label: 'Done (${done.length})', selected: _filter == _Filter.completed, onTap: () => setState(() => _filter = _Filter.completed)),
                ],
              ),
            ),
          ),
          if (shown.isEmpty)
            SliverFillRemaining(hasScrollBody: false, child: EmptyState(
              icon: _filter == _Filter.completed ? Icons.check_circle_rounded : Icons.checklist_rounded,
              title: _filter == _Filter.inbox ? 'Inbox is clear' : 'Nothing here',
              subtitle: _filter == _Filter.inbox ? 'Capture a task to get started.' : 'Try a different filter or add a new one.',
              actionLabel: _filter != _Filter.completed ? 'New task' : null,
              onAction: _filter != _Filter.completed ? () => _openEditor(null) : null,
            ))
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
              sliver: SliverList.builder(itemCount: shown.length + 1, itemBuilder: (_, i) {
                if (i == 0) return Padding(
                  padding: const EdgeInsets.only(bottom: 8, top: 4, left: 4),
                  child: Text('$sectionLabel · ${shown.length}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 1.2)),
                );
                final t = shown[i - 1];
                return _TaskRow(task: t, isMIT: mitIds.contains(t.id), onTap: () => _openEditor(t.id), onToggle: () => context.read<TasksProvider>().toggle(t.id), onDelete: () => context.read<TasksProvider>().remove(t.id));
              }),
            ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showQuickAdd(context),
        icon: const Icon(Icons.add_rounded, size: 20),
        label: const Text('New task'),
      ),
    );
  }

  void _openEditor(String? id) {
    HapticFeedback.lightImpact();
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => TaskEditorScreen(taskId: id), fullscreenDialog: true));
  }

  void _showSearch() {
    showDialog(context: context, builder: (_) => AlertDialog(
      title: TextField(controller: _search, autofocus: true, decoration: const InputDecoration(hintText: 'Search tasks…', border: InputBorder.none), onChanged: (_) => setState(() {})),
      content: const Text('Type to filter the visible list.'),
    ));
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? dot;
  const _FilterChip({required this.label, required this.selected, required this.onTap, this.dot});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: Semantics(
        button: true, selected: selected, label: label,
        child: InkWell(
          onTap: () { HapticFeedback.selectionClick(); onTap(); },
          borderRadius: BorderRadius.circular(22),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: selected ? AppTheme.primary : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkSurface : AppTheme.lightSurface),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: selected ? AppTheme.primary : Theme.of(context).dividerColor, width: 1.5),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              if (dot != null) ...[Container(width: 6, height: 6, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)), const SizedBox(width: 5)],
              Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: selected ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText))),
            ]),
          ),
        ),
      ),
    );
  }
}

class _TaskRow extends StatelessWidget {
  final Task task;
  final bool isMIT;
  final VoidCallback onTap;
  final VoidCallback onToggle;
  final VoidCallback onDelete;
  const _TaskRow({required this.task, required this.isMIT, required this.onTap, required this.onToggle, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Dismissible(
      key: ValueKey(task.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        margin: const EdgeInsets.only(bottom: 6),
        decoration: BoxDecoration(color: AppTheme.danger, borderRadius: BorderRadius.circular(14)),
        child: const Row(mainAxisAlignment: MainAxisAlignment.end, children: [Icon(Icons.delete_rounded, color: Colors.white), SizedBox(width: 8), Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700))]),
      ),
      onDismissed: (_) {
        onDelete();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('"${task.title}" deleted')));
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: isMIT ? AppTheme.primary.withValues(alpha: 0.4) : Theme.of(context).dividerColor),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              GestureDetector(
                onTap: () { HapticFeedback.selectionClick(); onToggle(); },
                child: Container(
                  width: 22, height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: task.completed ? AppTheme.success : Colors.transparent,
                    border: Border.all(color: task.completed ? AppTheme.success : Theme.of(context).dividerColor, width: 2),
                  ),
                  child: task.completed ? const Icon(Icons.check_rounded, color: Colors.white, size: 14) : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(task.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: isMIT ? FontWeight.w700 : FontWeight.w500, decoration: task.completed ? TextDecoration.lineThrough : null, color: task.completed ? (isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted) : (isDark ? AppTheme.darkText : AppTheme.lightText))),
                  if (task.firstStep.isNotEmpty) ...[const SizedBox(height: 2), Text('→ ${task.firstStep}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontStyle: FontStyle.italic))],
                  if (task.estimatedMinutes != null || task.dueDate != null || isMIT) ...[
                    const SizedBox(height: 6),
                    Wrap(spacing: 4, runSpacing: 4, children: [
                      _Tag(icon: task.energyIcon, label: task.energyLabel, color: task.energyColor),
                      if (task.estimatedMinutes != null) _Tag(icon: Icons.timer_outlined, label: task.estimatedLabel, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                      if (task.dueDate != null) _Tag(icon: Icons.calendar_today_rounded, label: DateFormat('MMM d').format(task.dueDate!), color: AppTheme.warning),
                      if (isMIT) _Tag(label: 'MIT', color: AppTheme.primary, filled: true),
                    ]),
                  ],
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final IconData? icon;
  final String label;
  final Color color;
  final bool filled;
  const _Tag({this.icon, required this.label, required this.color, this.filled = false});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: filled ? color : color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(4)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 10, color: filled ? Colors.white : color), const SizedBox(width: 2)],
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: filled ? Colors.white : color, letterSpacing: 0.3)),
      ]),
    );
  }
}
