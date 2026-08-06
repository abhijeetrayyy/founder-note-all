import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/task.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/projects_provider.dart';
import '../../providers/reminder_provider.dart';
import '../../providers/tag_provider.dart';
import '../../theme/app_theme.dart';
import '../widgets/tag_picker.dart';
import '../widgets/keyboard_safe.dart';
import 'task_breakdown_sheet.dart';

class TaskEditorScreen extends StatefulWidget {
  final String? taskId;
  final DateTime? initialDueDate;
  final bool initialAsMIT;
  const TaskEditorScreen({super.key, this.taskId, this.initialDueDate, this.initialAsMIT = false});

  @override State<TaskEditorScreen> createState() => _TaskEditorScreenState();
}

class _TaskEditorScreenState extends State<TaskEditorScreen> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _subtaskCtrl = TextEditingController();
  final _firstStep = TextEditingController();
  final _intention = TextEditingController();
  final _estimateCtrl = TextEditingController();

  int _priority = 1;
  int _energy = 1;
  DateTime? _dueDate;
  String? _projectId;
  bool _saving = false;
  bool _asMIT = false;
  List<Task> _subtasks = [];
  DateTime? _remindAt;
  int _recurrence = 0;
  Set<String> _tagIds = {};
  bool get _editing => widget.taskId != null;

  @override
  void initState() {
    super.initState();
    _dueDate = widget.initialDueDate;
    _asMIT = widget.initialAsMIT;
    if (_editing) _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    final p = context.read<TasksProvider>();
    final t = p.taskById(widget.taskId!);
    if (t == null) return;
    setState(() {
      _title.text = t.title;
      _desc.text = t.description;
      _priority = t.priority;
      _energy = t.energyLevel;
      _dueDate = t.dueDate;
      _projectId = t.projectId;
      _recurrence = t.recurrence;
      _firstStep.text = t.firstStep;
      _intention.text = t.implementationIntention;
      _estimateCtrl.text = t.estimatedMinutes == null ? '' : t.estimatedMinutes.toString();
      _asMIT = t.isInbox == false && p.taskById(t.id) != null;
      _subtasks = p.subtasksFor(t.id);
    });
    if (!mounted) return;
    final tags = await context.read<TagProvider>().getForTask(widget.taskId!);
    if (!mounted) return;
    setState(() => _tagIds = tags.map((t) => t.id).toSet());
    if (!mounted) return;
    final r = context.read<ReminderProvider>().getForTask(widget.taskId!);
    if (r != null) setState(() => _remindAt = r.remindAt);
  }

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    _subtaskCtrl.dispose();
    _firstStep.dispose();
    _intention.dispose();
    _estimateCtrl.dispose();
    super.dispose();
  }

  Future<void> _save({bool pop = true}) async {
    if (_saving) return;
    final t = _title.text.trim();
    if (t.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add a title first')));
      return;
    }
    setState(() => _saving = true);
    final tp = context.read<TasksProvider>();
    final rp = context.read<ReminderProvider>();
    final tagp = context.read<TagProvider>();
    final estimate = _estimateCtrl.text.trim().isEmpty ? null : int.tryParse(_estimateCtrl.text.trim());
    try {
      if (_editing) {
        await tp.update(
          id: widget.taskId!,
          title: t,
          description: _desc.text.trim(),
          priority: _priority,
          energyLevel: _energy,
          estimatedMinutes: estimate,
          clearEstimate: estimate == null,
          firstStep: _firstStep.text.trim(),
          implementationIntention: _intention.text.trim(),
          isInbox: !_asMIT,
          dueDate: _dueDate, clearDueDate: _dueDate == null,
          projectId: _projectId, clearProject: _projectId == null,
          recurrence: _recurrence,
        );
        await tagp.setTaskTags(widget.taskId!, _tagIds.toList());
        if (_remindAt != null) {
          await rp.scheduleForTask(Task(id: widget.taskId!, title: t, dueDate: _dueDate), _remindAt!);
        } else {
          await rp.removeForTask(widget.taskId!);
        }
      } else {
        final created = await tp.add(
          title: t,
          description: _desc.text.trim(),
          priority: _priority,
          energyLevel: _energy,
          estimatedMinutes: estimate,
          firstStep: _firstStep.text.trim(),
          implementationIntention: _intention.text.trim(),
          isInbox: !_asMIT,
          dueDate: _dueDate,
          projectId: _projectId,
          recurrence: _recurrence,
        );
        await tagp.setTaskTags(created.id, _tagIds.toList());
        if (_remindAt != null) {
          await rp.scheduleForTask(created, _remindAt!);
        }
      }
      if (mounted && pop) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  Future<void> _delete() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete task?'),
        content: Text('"${_title.text}" will be permanently removed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: AppTheme.danger), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    await context.read<TasksProvider>().remove(widget.taskId!);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final projects = context.watch<ProjectsProvider>().projects;

    return KeyboardSafeScaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
        title: Text(_editing ? 'Edit task' : 'New task', style: const TextStyle(fontSize: 18)),
        actions: [
          if (_editing) IconButton(icon: const Icon(Icons.delete_outline_rounded), onPressed: _delete),
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
        children: [
          // ── Title (big, prominent)
          TextField(
            controller: _title,
            autofocus: !_editing,
            textCapitalization: TextCapitalization.sentences,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, height: 1.3),
            maxLines: null,
            decoration: const InputDecoration(
              hintText: 'Task title',
              border: InputBorder.none,
              filled: false,
              contentPadding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(height: 4),

          // ── Quick actions row (the most-used) — 48px min touch target
          Wrap(spacing: 8, runSpacing: 8, children: [
            _QuickPill(
              icon: _asMIT ? Icons.star_rounded : Icons.star_border_rounded,
              label: _asMIT ? 'MIT' : 'Make MIT',
              color: AppTheme.primary,
              active: _asMIT,
              onTap: () { HapticFeedback.selectionClick(); setState(() => _asMIT = !_asMIT); },
            ),
            _QuickPill(
              icon: Icons.flag_rounded,
              label: ['Low', 'Medium', 'High'][_priority],
              color: [Colors.green, Colors.orange, Colors.red][_priority],
              active: _priority > 0,
              onTap: () { HapticFeedback.selectionClick(); setState(() => _priority = (_priority + 1) % 3); },
            ),
            _QuickPill(
              icon: ['Admin', 'Medium', 'Deep'][_energy] == 'Admin' ? Icons.inbox_rounded : (['Admin', 'Medium', 'Deep'][_energy] == 'Medium' ? Icons.bolt_rounded : Icons.psychology_rounded),
              label: ['Admin', 'Medium', 'Deep'][_energy],
              color: [AppTheme.energyAdmin, AppTheme.energyMedium, AppTheme.energyDeep][_energy],
              active: true,
              onTap: () { HapticFeedback.selectionClick(); setState(() => _energy = (_energy + 1) % 3); },
            ),
            _QuickPill(
              icon: Icons.calendar_today_rounded,
              label: _dueDate == null ? 'Date' : DateFormat('MMM d').format(_dueDate!),
              color: AppTheme.primary,
              active: _dueDate != null,
              onTap: () async {
                HapticFeedback.selectionClick();
                final d = await showDatePicker(context: context, initialDate: _dueDate ?? DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2035));
                setState(() => _dueDate = d);
              },
            ),
            _QuickPill(
              icon: Icons.timer_outlined,
              label: _estimateCtrl.text.isEmpty ? 'Estimate' : '${_estimateCtrl.text}m',
              color: AppTheme.primary,
              active: _estimateCtrl.text.isNotEmpty,
              onTap: () { HapticFeedback.selectionClick(); _showEstimatePicker(); },
            ),
          ]),

          const SizedBox(height: 20),
          const _SectionTitle('NOTES'),
          TextField(
            controller: _desc,
            style: const TextStyle(fontSize: 15, height: 1.6),
            maxLines: null,
            minLines: 1,
            decoration: InputDecoration(
              hintText: 'Add details, links, or context…',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
              contentPadding: const EdgeInsets.all(14),
            ),
          ),

          const SizedBox(height: 20),
          const _SectionTitle('FIRST MICRO-STEP'),
          TextField(
            controller: _firstStep,
            style: const TextStyle(fontSize: 15, height: 1.4),
            decoration: InputDecoration(
              hintText: "What's the smallest first action?",
              prefixIcon: const Icon(Icons.play_arrow_rounded, color: AppTheme.primary, size: 18),
              filled: true, fillColor: AppTheme.primary.withValues(alpha: 0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            ),
          ),

          const SizedBox(height: 20),
          const _SectionTitle('WHEN/WHERE TRIGGER'),
          TextField(
            controller: _intention,
            style: const TextStyle(fontSize: 15, height: 1.4),
            decoration: InputDecoration(
              hintText: 'When [cue], I will [action] at [place]…',
              prefixIcon: const Icon(Icons.bolt_outlined, color: Colors.amber, size: 18),
              filled: true, fillColor: Colors.amber.withValues(alpha: 0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            ),
          ),

          const SizedBox(height: 12),
          // "Feeling stuck?" button — opens guided breakdown sheet
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _showBreakdownSheet(),
              icon: const Icon(Icons.psychology_rounded, size: 18),
              label: Text(_firstStep.text.isNotEmpty || _intention.text.isNotEmpty ? 'Update breakdown' : 'Feeling stuck?'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primary,
                side: const BorderSide(color: AppTheme.primary, width: 1.2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),

          const SizedBox(height: 20),
          const _SectionTitle('PROJECT'),
          Wrap(spacing: 6, runSpacing: 6, children: [
            _QuickPill(icon: Icons.block_rounded, label: 'None', color: Colors.grey, active: _projectId == null, onTap: () => setState(() => _projectId = null)),
            ...projects.map((p) => _QuickPill(icon: Icons.folder_rounded, label: p.name, color: Color(p.color), active: _projectId == p.id, onTap: () => setState(() => _projectId = p.id))),
          ]),

          const SizedBox(height: 20),
          const _SectionTitle('TAGS'),
          TagPicker(selectedTagIds: _tagIds, onChanged: (ids) => setState(() => _tagIds = ids)),

          const SizedBox(height: 20),
          const _SectionTitle('REMINDER'),
          Wrap(spacing: 6, runSpacing: 6, children: [
            _QuickPill(
              icon: Icons.notifications_rounded,
              label: _remindAt == null ? 'None' : DateFormat('MMM d, h:mm a').format(_remindAt!),
              color: AppTheme.warning,
              active: _remindAt != null,
              onTap: () async {
                if (_remindAt == null) {
                  final t = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 9, minute: 0));
                  if (t != null) setState(() => _remindAt = DateTime(_dueDate?.year ?? DateTime.now().year, _dueDate?.month ?? DateTime.now().month, _dueDate?.day ?? DateTime.now().day, t.hour, t.minute));
                } else {
                  setState(() => _remindAt = null);
                }
              },
            ),
          ]),

          const SizedBox(height: 20),
          const _SectionTitle('REPEAT'),
          Wrap(spacing: 6, runSpacing: 6, children: [
            for (final r in TaskRecurrence.values) _QuickPill(
              icon: Icons.repeat_rounded,
              label: r == TaskRecurrence.none ? 'Never' : r.name[0].toUpperCase() + r.name.substring(1),
              color: AppTheme.warning,
              active: _recurrence == r.index,
              onTap: () => setState(() => _recurrence = r.index),
            ),
          ]),

          if (_editing) ...[
            const SizedBox(height: 20),
            _SectionTitle('SUBTASKS (${_subtasks.where((s) => s.completed).length}/${_subtasks.length})'),
            const SizedBox(height: 6),
            ..._subtasks.map((s) => Container(
              margin: const EdgeInsets.only(bottom: 4),
              decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(10)),
              child: ListTile(
                dense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                leading: GestureDetector(
                  onTap: () => context.read<TasksProvider>().toggle(s.id),
                  child: Icon(s.completed ? Icons.check_circle : Icons.radio_button_unchecked, color: s.completed ? AppTheme.success : Colors.grey, size: 20),
                ),
                title: Text(s.title, style: TextStyle(decoration: s.completed ? TextDecoration.lineThrough : null, fontSize: 14)),
                trailing: IconButton(icon: const Icon(Icons.close, size: 16), onPressed: () {
                  context.read<TasksProvider>().removeSubtask(s.id, widget.taskId!);
                  setState(() => _subtasks = context.read<TasksProvider>().subtasksFor(widget.taskId!));
                }),
              ),
            )),
            const SizedBox(height: 6),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _subtaskCtrl,
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(
                    hintText: 'Add subtask…',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    isDense: true,
                  ),
                  onSubmitted: (text) {
                    if (text.trim().isEmpty) return;
                    context.read<TasksProvider>().addSubtask(widget.taskId!, text.trim());
                    _subtaskCtrl.clear();
                    setState(() => _subtasks = context.read<TasksProvider>().subtasksFor(widget.taskId!));
                  },
                ),
              ),
              const SizedBox(width: 6),
              IconButton(onPressed: () {
                if (_subtaskCtrl.text.trim().isEmpty) return;
                context.read<TasksProvider>().addSubtask(widget.taskId!, _subtaskCtrl.text.trim());
                _subtaskCtrl.clear();
                setState(() => _subtasks = context.read<TasksProvider>().subtasksFor(widget.taskId!));
              }, icon: const Icon(Icons.add_circle_rounded, color: AppTheme.primary)),
            ]),
          ],
        ],
      ),
    );
  }

  void _showBreakdownSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.sheetRadius))),
      builder: (_) => TaskBreakdownSheet(
        firstStep: _firstStep.text,
        implementationIntention: _intention.text,
        currentEnergy: _energy,
        onFirstStepSaved: (v) => _firstStep.text = v,
        onIntentionSaved: (v) => _intention.text = v,
        onMatchEnergy: () => setState(() => _energy = 0),
      ),
    );
  }

  void _showEstimatePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('How long will this take?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('Best honest guess. We track your accuracy over time.', style: TextStyle(fontSize: 13, color: Theme.of(ctx).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
                const SizedBox(height: 18),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  for (final m in [10, 15, 25, 45, 60, 90, 120])
                    ChoiceChip(
                      label: Text(m < 60 ? '${m}m' : '${m ~/ 60}h ${m % 60}m'),
                      selected: _estimateCtrl.text == m.toString(),
                      onSelected: (_) {
                        setState(() => _estimateCtrl.text = m.toString());
                        Navigator.pop(ctx);
                      },
                    ),
                ]),
                const SizedBox(height: 12),
                TextField(
                  controller: _estimateCtrl,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: 'Custom minutes', prefixIcon: Icon(Icons.timer_outlined)),
                ),
                const SizedBox(height: 12),
                SizedBox(width: double.infinity, child: FilledButton(onPressed: () { Navigator.pop(ctx); setState(() {}); }, child: const Text('Done'))),
              ]),
            ),
          ),
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(2, 0, 0, 8),
    child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.4, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
  );
}

class _QuickPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool active;
  final VoidCallback onTap;
  const _QuickPill({required this.icon, required this.label, required this.color, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true, selected: active, label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: active ? color : Colors.transparent,
            border: Border.all(color: active ? color : Theme.of(context).dividerColor, width: 1.5),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 14, color: active ? Colors.white : color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: active ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText))),
          ]),
        ),
      ),
    );
  }
}
