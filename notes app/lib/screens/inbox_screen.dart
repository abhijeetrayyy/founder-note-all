import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/tasks_provider.dart';
import '../providers/daily_plan_provider.dart';
import '../providers/notes_provider.dart';
import '../models/task.dart';
import '../models/note.dart';
import '../theme/app_theme.dart';
import 'widgets/empty_state.dart';
import 'widgets/quick_add_sheet.dart';
import 'tasks/task_editor_screen.dart';
import 'notes/note_editor_screen.dart';

/// Unified inbox: tasks + notes not yet triaged.
/// Process to zero with batch actions, swipe triage, quick classify.
class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});
  @override State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  final _search = TextEditingController();
  bool _selecting = false;
  final Set<String> _selectedTaskIds = {};
  final Set<String> _selectedNoteIds = {};

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final taskInbox = tasks.tasks.where((t) => !t.completed && t.isInbox).toList();
    final noteInbox = notes.notes.where((n) => !n.isArchived).toList();
    final total = taskInbox.length + noteInbox.length;
    final q = _search.text.trim().toLowerCase();

    final filteredTasks = q.isEmpty ? taskInbox : taskInbox.where((t) => t.title.toLowerCase().contains(q) || t.description.toLowerCase().contains(q)).toList();
    final filteredNotes = q.isEmpty ? noteInbox : noteInbox.where((n) => n.title.toLowerCase().contains(q) || n.content.toLowerCase().contains(q)).toList();

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true, floating: true, backgroundColor: Theme.of(context).scaffoldBackgroundColor, automaticallyImplyLeading: false,
            title: const Text('Inbox', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
            actions: [
              if (_selecting) ...[
                TextButton(onPressed: () {
                  setState(() { _selecting = false; _selectedTaskIds.clear(); _selectedNoteIds.clear(); });
                }, child: const Text('Cancel')),
                const SizedBox(width: 4),
              ] else
                IconButton(icon: const Icon(Icons.checklist_rounded), onPressed: () => setState(() => _selecting = !_selecting), tooltip: 'Select'),
              if (_selecting && (_selectedTaskIds.isNotEmpty || _selectedNoteIds.isNotEmpty))
                IconButton(icon: const Icon(Icons.delete_outline_rounded), onPressed: _batchDelete),
              IconButton(icon: const Icon(Icons.search_rounded), onPressed: _showSearch),
            ],
          ),
          if (total == 0)
            SliverFillRemaining(hasScrollBody: false, child: EmptyState(
              icon: Icons.inbox_rounded,
              title: 'Inbox zero',
              subtitle: 'Tidy mind. Capture anything from the + button or by typing below.',
              actionLabel: 'Quick add',
              onAction: () => showQuickAdd(context),
            ))
          else ...[
            SliverToBoxAdapter(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDeep]),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(children: [
                  const Icon(Icons.inbox_rounded, color: Colors.white, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('$total ${total == 1 ? "item" : "items"} waiting', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 2),
                      Text('Swipe right to MIT, left to schedule.', style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12)),
                    ]),
                  ),
                ]),
              ),
            )),
            if (filteredTasks.isNotEmpty) ...[
              SliverToBoxAdapter(child: _SectionHeader(label: 'TASKS', count: filteredTasks.length)),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                sliver: SliverList.builder(itemCount: filteredTasks.length, itemBuilder: (_, i) {
                  final t = filteredTasks[i];
                  return _InboxTaskRow(
                    task: t,
                    selecting: _selecting,
                    selected: _selectedTaskIds.contains(t.id),
                    onTap: () {
                      if (_selecting) {
                        setState(() { _selectedTaskIds.contains(t.id) ? _selectedTaskIds.remove(t.id) : _selectedTaskIds.add(t.id); });
                      } else {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => TaskEditorScreen(taskId: t.id), fullscreenDialog: true));
                      }
                    },
                    onToggle: () => tasks.toggle(t.id),
                    onMIT: () => _mitTask(t),
                    onSchedule: () => _scheduleTask(t),
                    onDelete: () => tasks.remove(t.id),
                  );
                }),
              ),
            ],
            if (filteredNotes.isNotEmpty) ...[
              SliverToBoxAdapter(child: _SectionHeader(label: 'NOTES', count: filteredNotes.length)),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverList.builder(itemCount: filteredNotes.length, itemBuilder: (_, i) {
                  final n = filteredNotes[i];
                  return _InboxNoteRow(
                    note: n,
                    selecting: _selecting,
                    selected: _selectedNoteIds.contains(n.id),
                    onTap: () {
                      if (_selecting) {
                        setState(() { _selectedNoteIds.contains(n.id) ? _selectedNoteIds.remove(n.id) : _selectedNoteIds.add(n.id); });
                      } else {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => NoteEditorScreen(noteId: n.id), fullscreenDialog: true));
                      }
                    },
                    onArchive: () => notes.toggleArchive(n.id),
                    onDelete: () => notes.remove(n.id),
                  );
                }),
              ),
            ] else
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ],
      ),
      floatingActionButton: _selecting ? null : FloatingActionButton.extended(
        onPressed: () => showQuickAdd(context),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Capture'),
      ),
    );
  }

  Future<void> _mitTask(Task t) async {
    final plan = context.read<DailyPlanProvider>();
    if (plan.todayPlan == null) {
      await plan.savePlan(mitTaskIds: [t.id], intentionText: '', blockerNotes: '');
    } else {
      final ids = List<String>.from(plan.todayPlan!.mitTaskIds);
      if (ids.length >= 3) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Already 3 MITs. Replace one in the plan view.')));
        return;
      }
      if (!ids.contains(t.id)) ids.add(t.id);
      await plan.updateMITs(ids);
    }
    await context.read<TasksProvider>().setInbox(t.id, false);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('"${t.title}" added as MIT')));
  }

  Future<void> _scheduleTask(Task t) async {
    final picked = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2035));
    if (picked == null || !mounted) return;
    await context.read<TasksProvider>().update(id: t.id, dueDate: picked, isInbox: false);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Scheduled for ${DateFormat('MMM d').format(picked)}')));
  }

  Future<void> _batchDelete() async {
    final confirm = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('Delete selected?'), content: Text('${_selectedTaskIds.length + _selectedNoteIds.length} items will be removed.'), actions: [
      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
      FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: AppTheme.danger), child: const Text('Delete')),
    ]));
    if (confirm != true || !mounted) return;
    final tp = context.read<TasksProvider>();
    final np = context.read<NotesProvider>();
    for (final id in _selectedTaskIds) {
      await tp.remove(id);
    }
    for (final id in _selectedNoteIds) {
      await np.remove(id);
    }
    setState(() { _selectedTaskIds.clear(); _selectedNoteIds.clear(); _selecting = false; });
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deleted')));
  }

  void _showSearch() {
    showDialog(context: context, builder: (_) => AlertDialog(
      title: TextField(controller: _search, autofocus: true, decoration: const InputDecoration(hintText: 'Search inbox…', border: InputBorder.none), onChanged: (_) => setState(() {})),
      content: const Text('Type to filter tasks and notes.'),
    ));
  }
}

class _InboxTaskRow extends StatelessWidget {
  final Task task;
  final bool selecting;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onToggle;
  final VoidCallback onMIT;
  final VoidCallback onSchedule;
  final VoidCallback onDelete;
  const _InboxTaskRow({required this.task, required this.selecting, required this.selected, required this.onTap, required this.onToggle, required this.onMIT, required this.onSchedule, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Dismissible(
      key: ValueKey('inbox_task_${task.id}'),
      background: _SwipeBg(color: AppTheme.primary, icon: Icons.star_rounded, label: 'MIT', align: Alignment.centerLeft),
      secondaryBackground: _SwipeBg(color: AppTheme.warning, icon: Icons.calendar_today_rounded, label: 'Schedule', align: Alignment.centerRight),
      confirmDismiss: (dir) async {
        if (dir == DismissDirection.startToEnd) { onMIT(); return false; }
        if (dir == DismissDirection.endToStart) { onSchedule(); return false; }
        return false;
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          onLongPress: selecting ? null : onDelete,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(color: selected ? AppTheme.primary.withValues(alpha: isDark ? 0.15 : 0.06) : Theme.of(context).cardColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: selected ? AppTheme.primary : Theme.of(context).dividerColor)),
            child: Row(children: [
              GestureDetector(
                onTap: onToggle,
                child: Container(
                  width: 22, height: 22,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: task.completed ? AppTheme.success : Colors.transparent, border: Border.all(color: task.completed ? AppTheme.success : Theme.of(context).dividerColor, width: 2)),
                  child: task.completed ? const Icon(Icons.check_rounded, color: Colors.white, size: 14) : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(task.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, decoration: task.completed ? TextDecoration.lineThrough : null)),
                  if (task.firstStep.isNotEmpty) ...[const SizedBox(height: 2), Text('→ ${task.firstStep}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontStyle: FontStyle.italic))],
                ]),
              ),
              Icon(task.energyIcon, size: 14, color: task.energyColor),
            ]),
          ),
        ),
      ),
    );
  }
}

class _InboxNoteRow extends StatelessWidget {
  final Note note;
  final bool selecting;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onArchive;
  final VoidCallback onDelete;
  const _InboxNoteRow({required this.note, required this.selecting, required this.selected, required this.onTap, required this.onArchive, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Dismissible(
      key: ValueKey('inbox_note_${note.id}'),
      direction: DismissDirection.endToStart,
      background: _SwipeBg(color: AppTheme.energyMedium, icon: Icons.archive_rounded, label: 'Archive', align: Alignment.centerRight),
      confirmDismiss: (_) async { onArchive(); return false; },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          onLongPress: selecting ? null : onDelete,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: selected ? AppTheme.primary.withValues(alpha: 0.06) : Theme.of(context).cardColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: selected ? AppTheme.primary : Theme.of(context).dividerColor)),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(width: 4, height: 36, decoration: BoxDecoration(color: Color(note.color), borderRadius: BorderRadius.circular(2))),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(note.title.isEmpty ? 'Untitled' : note.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  if (note.content.isNotEmpty) ...[const SizedBox(height: 2), Text(note.content, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted))],
                ]),
              ),
              const SizedBox(width: 6),
              Text(DateFormat('MMM d').format(note.updatedAt), style: TextStyle(fontSize: 11, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
            ]),
          ),
        ),
      ),
    );
  }
}

class _SwipeBg extends StatelessWidget {
  final Color color;
  final IconData icon;
  final String label;
  final Alignment align;
  const _SwipeBg({required this.color, required this.icon, required this.label, required this.align});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 6),
    padding: const EdgeInsets.symmetric(horizontal: 20),
    alignment: align,
    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, color: Colors.white, size: 18), const SizedBox(width: 6), Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))]),
  );
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final int count;
  const _SectionHeader({required this.label, required this.count});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
    child: Row(children: [
      Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.4, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
      const SizedBox(width: 6),
      Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1), decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(6)), child: Text('$count', style: const TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w800))),
    ]),
  );
}
