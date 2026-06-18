import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/notes_provider.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/projects_provider.dart';
import '../../providers/daily_plan_provider.dart';
import '../../utils/smart_input.dart';
import '../../theme/app_theme.dart';
import 'keyboard_safe.dart';

/// Explicit override for the captured item type.
/// `null` means: follow the parser's decision.
enum _TypeOverride { note, task, mit }

/// Public type hint for the initial state of the sheet.
enum QuickAddType { auto, task, note, mit }

class QuickAddSheet extends StatefulWidget {
  final String? prefill;
  final bool defaultToMIT;
  final QuickAddType initialType;
  const QuickAddSheet({super.key, this.prefill, this.defaultToMIT = false, this.initialType = QuickAddType.auto});

  @override
  State<QuickAddSheet> createState() => _QuickAddSheetState();
}

class _QuickAddSheetState extends State<QuickAddSheet> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();
  SmartInput _parsed = const SmartInput(original: '', cleanedTitle: '');
  _TypeOverride? _override;
  bool _showAdvanced = false;
  bool _saving = false;

  int _energy = 1;
  int? _estimate;
  String _firstStep = '';
  String _intention = '';
  String? _projectId;
  DateTime? _manualDate;
  TimeOfDayValue? _manualTime;
  int? _manualPriority;
  int? _manualRecurrence;

  @override
  void initState() {
    super.initState();
    if (widget.prefill != null) _ctrl.text = widget.prefill!;
    if (widget.defaultToMIT || widget.initialType == QuickAddType.mit) {
      _override = _TypeOverride.mit;
    } else if (widget.initialType == QuickAddType.task) {
      _override = _TypeOverride.task;
    } else if (widget.initialType == QuickAddType.note) {
      _override = _TypeOverride.note;
    }
    _ctrl.addListener(_onChange);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focus.requestFocus();
      _onChange();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _onChange() {
    final text = _ctrl.text;
    final p = SmartInput.parse(text);
    setState(() {
      _parsed = p;
      if (_manualDate == null) _manualDate = p.date;
      if (_manualTime == null) _manualTime = p.time;
      if (_manualPriority == null) _manualPriority = p.priority;
      if (_manualRecurrence == null) _manualRecurrence = p.recurrence;
      if (p.energy != null) _energy = p.energy!;
    });
  }

  /// What type will the item be saved as?
  /// - Explicit override wins
  /// - Otherwise, follow the parser
  bool get _isTask {
    if (_override == _TypeOverride.note) return false;
    if (_override == _TypeOverride.task || _override == _TypeOverride.mit) return true;
    return _parsed.isTask;
  }

  bool get _isMIT => _override == _TypeOverride.mit;

  Future<void> _save() async {
    if (_saving) return;
    final text = _ctrl.text.trim();
    if (text.isEmpty) {
      Navigator.pop(context);
      return;
    }
    setState(() => _saving = true);

    HapticFeedback.lightImpact();

    if (!_isTask) {
      final firstLine = text.split('\n').first;
      final rest = text.split('\n').skip(1).join('\n');
      await context.read<NotesProvider>().add(title: firstLine, content: rest, projectId: _projectId);
      if (mounted) Navigator.pop(context, _QuickAddResult(type: _QuickAddType.note, text: firstLine));
      return;
    }

    final cleaned = _parsed.cleanedTitle.isEmpty ? text : _parsed.cleanedTitle;
    final task = await context.read<TasksProvider>().add(
          title: cleaned,
          priority: _manualPriority ?? 1,
          energyLevel: _energy,
          estimatedMinutes: _estimate,
          firstStep: _firstStep,
          implementationIntention: _intention,
          dueDate: _composeDate(),
          projectId: _projectId,
          recurrence: _manualRecurrence ?? 0,
          isInbox: !_isMIT,
        );

    if (_isMIT) {
      final plan = context.read<DailyPlanProvider>();
      if (plan.todayPlan == null) {
        await plan.savePlan(mitTaskIds: [task.id], intentionText: '', blockerNotes: '');
      } else {
        final ids = List<String>.from(plan.todayPlan!.mitTaskIds);
        if (ids.length < 3 && !ids.contains(task.id)) ids.add(task.id);
        await plan.updateMITs(ids);
      }
    }

    if (!mounted) return;
    Navigator.pop(context, _QuickAddResult(type: _isMIT ? _QuickAddType.mit : _QuickAddType.task, text: cleaned, id: task.id));
  }

  DateTime? _composeDate() {
    final d = _manualDate;
    final t = _manualTime;
    if (d == null && t == null) return null;
    final base = d ?? DateTime.now();
    if (t == null) return base;
    return DateTime(base.year, base.month, base.day, t.hour, t.minute);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isTask = _isTask;
    final cleaned = _parsed.cleanedTitle.isEmpty ? _ctrl.text : _parsed.cleanedTitle;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: Text(
                  isTask ? (_isMIT ? 'New MIT' : 'New task') : 'New note',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context), tooltip: 'Cancel'),
            ]),
            const SizedBox(height: 4),
            Text(
              isTask
                  ? "Type naturally. Add dates, times, or 'mit' anywhere."
                  : "Type your thought. Use # for tags, @ for projects.",
              style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 14),

            // ── Type toggle (always visible, explicit)
            Row(children: [
              Expanded(child: _TypePill(label: 'Note', icon: Icons.notes_rounded, active: !isTask, onTap: () { HapticFeedback.selectionClick(); setState(() => _override = _TypeOverride.note); })),
              const SizedBox(width: 6),
              Expanded(child: _TypePill(label: 'Task', icon: Icons.check_circle_outline_rounded, active: isTask && !_isMIT, onTap: () { HapticFeedback.selectionClick(); setState(() => _override = _TypeOverride.task); })),
              const SizedBox(width: 6),
              Expanded(child: _TypePill(label: 'MIT', icon: Icons.star_rounded, active: _isMIT, onTap: () { HapticFeedback.selectionClick(); setState(() => _override = _TypeOverride.mit); })),
            ]),
            const SizedBox(height: 14),

            // ── Main input
            TextField(
              controller: _ctrl,
              focusNode: _focus,
              autofocus: true,
              maxLines: null,
              minLines: 1,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.newline,
              style: const TextStyle(fontSize: 17, height: 1.4, fontWeight: FontWeight.w500),
              decoration: InputDecoration(
                hintText: isTask ? "e.g. 'Review pitch deck tomorrow at 3pm'" : "What's on your mind?",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              onSubmitted: (_) {},
            ),

            // ── Cleaned preview
            if (cleaned.isNotEmpty && cleaned != _ctrl.text) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(10)),
                child: Row(children: [
                  const Icon(Icons.auto_awesome_rounded, size: 14, color: AppTheme.primary),
                  const SizedBox(width: 6),
                  Expanded(child: Text(cleaned, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primary))),
                ]),
              ),
            ],

            // ── Detected chips (tasks only)
            if (isTask) ...[
              const SizedBox(height: 16),
              _DetectedChipsRow(
                date: _manualDate,
                time: _manualTime,
                priority: _manualPriority,
                energy: _energy,
                recurrence: _manualRecurrence,
                onDate: (d) => setState(() => _manualDate = d),
                onTime: (t) => setState(() => _manualTime = t),
                onPriority: (p) => setState(() => _manualPriority = p),
                onEnergy: (e) => setState(() => _energy = e),
                onRecurrence: (r) => setState(() => _manualRecurrence = r),
              ),
            ],

            // ── Advanced toggle
            const SizedBox(height: 14),
            InkWell(
              onTap: () { HapticFeedback.selectionClick(); setState(() => _showAdvanced = !_showAdvanced); },
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                child: Row(children: [
                  Icon(_showAdvanced ? Icons.expand_less_rounded : Icons.expand_more_rounded, size: 18, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                  const SizedBox(width: 6),
                  Text(_showAdvanced ? 'Hide options' : 'More options (project, estimate, steps)', style: TextStyle(fontSize: 13, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, fontWeight: FontWeight.w600)),
                ]),
              ),
            ),
            if (_showAdvanced) ...[
              const SizedBox(height: 12),
              _AdvancedFields(
                energy: _energy, onEnergy: (v) => setState(() => _energy = v),
                estimate: _estimate, onEstimate: (v) => setState(() => _estimate = v),
                firstStep: _firstStep, onFirstStep: (v) => setState(() => _firstStep = v),
                intention: _intention, onIntention: (v) => setState(() => _intention = v),
                projectId: _projectId, onProject: (v) => setState(() => _projectId = v),
              ),
            ],

            // ── Actions
            const SizedBox(height: 18),
            Row(children: [
              TextButton(onPressed: () => Navigator.pop(context), style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14)), child: const Text('Cancel')),
              const Spacer(),
              FilledButton.icon(
                onPressed: _ctrl.text.trim().isEmpty ? null : _save,
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                icon: Icon(_isMIT ? Icons.star_rounded : (isTask ? Icons.check_rounded : Icons.save_rounded), size: 18),
                label: Text(_isMIT ? 'Add as MIT' : (isTask ? 'Add to Inbox' : 'Save note')),
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}

class _TypePill extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;
  const _TypePill({required this.label, required this.icon, required this.active, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true, selected: active, label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 48,
          decoration: BoxDecoration(
            color: active ? AppTheme.primary : Colors.transparent,
            border: Border.all(color: active ? AppTheme.primary : Theme.of(context).dividerColor, width: 1.5),
            borderRadius: BorderRadius.circular(14),
          ),
          alignment: Alignment.center,
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(icon, size: 16, color: active ? Colors.white : Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: active ? Colors.white : Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText)),
          ]),
        ),
      ),
    );
  }
}

class _DetectedChipsRow extends StatelessWidget {
  final DateTime? date;
  final TimeOfDayValue? time;
  final int? priority;
  final int energy;
  final int? recurrence;
  final ValueChanged<DateTime?> onDate;
  final ValueChanged<TimeOfDayValue?> onTime;
  final ValueChanged<int?> onPriority;
  final ValueChanged<int> onEnergy;
  final ValueChanged<int?> onRecurrence;

  const _DetectedChipsRow({
    required this.date,
    required this.time,
    required this.priority,
    required this.energy,
    required this.recurrence,
    required this.onDate,
    required this.onTime,
    required this.onPriority,
    required this.onEnergy,
    required this.onRecurrence,
  });

  String _dateLabel() {
    if (date == null) return 'Date';
    final d = date!;
    final now = DateTime.now();
    if (d.year == now.year && d.month == now.month && d.day == now.day) return 'Today';
    if (d.year == now.year && d.month == now.month && d.day == now.day + 1) return 'Tomorrow';
    return DateFormat('MMM d').format(d);
  }

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SectionLabel('WHEN & WHERE'),
      const SizedBox(height: 6),
      Wrap(spacing: 6, runSpacing: 6, children: [
        _Chip(
          label: _dateLabel(), icon: Icons.calendar_today_rounded, color: AppTheme.primary, active: date != null,
          onTap: () async {
            final d = await showDatePicker(context: context, initialDate: date ?? DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2035));
            onDate(d);
          },
          onLongPress: date != null ? () => onDate(null) : null,
        ),
        _Chip(
          label: time?.label ?? 'Time', icon: Icons.access_time_rounded, color: AppTheme.primary, active: time != null,
          onTap: () async {
            final t = await showTimePicker(context: context, initialTime: TimeOfDay(hour: time?.hour ?? 9, minute: time?.minute ?? 0));
            if (t != null) onTime(TimeOfDayValue(t.hour, t.minute, '${t.hour.toString().padLeft(2, "0")}:${t.minute.toString().padLeft(2, "0")}'));
          },
          onLongPress: time != null ? () => onTime(null) : null,
        ),
      ]),
      const SizedBox(height: 12),
      _SectionLabel('PRIORITY & ENERGY'),
      const SizedBox(height: 6),
      Wrap(spacing: 6, runSpacing: 6, children: [
        _Chip(
          label: ['Low', 'Medium', 'High'][priority ?? 1], icon: Icons.flag_rounded, color: [Colors.green, Colors.orange, Colors.red][priority ?? 1], active: priority != null,
          onTap: () => onPriority(((priority ?? 0) + 1) % 3),
          onLongPress: priority != null ? () => onPriority(null) : null,
        ),
        _Chip(
          label: ['Admin', 'Medium', 'Deep'][energy], icon: [Icons.inbox_rounded, Icons.bolt_rounded, Icons.psychology_rounded][energy], color: [AppTheme.energyAdmin, AppTheme.energyMedium, AppTheme.energyDeep][energy], active: true,
          onTap: () => onEnergy((energy + 1) % 3),
        ),
        _Chip(
          label: ['—', 'Daily', 'Weekly', 'Monthly'][recurrence ?? 0], icon: Icons.repeat_rounded, color: AppTheme.warning, active: (recurrence ?? 0) > 0,
          onTap: () => onRecurrence((((recurrence ?? 0)) + 1) % 4),
          onLongPress: (recurrence ?? 0) > 0 ? () => onRecurrence(null) : null,
        ),
      ]),
    ]);
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 1.4));
}

class _Chip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final bool active;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  const _Chip({required this.label, required this.icon, required this.color, required this.active, required this.onTap, this.onLongPress});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true, selected: active, label: label,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: active ? color : Colors.transparent,
            border: Border.all(color: active ? color : Theme.of(context).dividerColor, width: 1.5),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 13, color: active ? Colors.white : color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: active ? Colors.white : color)),
          ]),
        ),
      ),
    );
  }
}

class _AdvancedFields extends StatefulWidget {
  final int energy;
  final int? estimate;
  final String firstStep;
  final String intention;
  final String? projectId;
  final ValueChanged<int> onEnergy;
  final ValueChanged<int?> onEstimate;
  final ValueChanged<String> onFirstStep;
  final ValueChanged<String> onIntention;
  final ValueChanged<String?> onProject;
  const _AdvancedFields({
    required this.energy,
    required this.estimate,
    required this.firstStep,
    required this.intention,
    required this.projectId,
    required this.onEnergy,
    required this.onEstimate,
    required this.onFirstStep,
    required this.onIntention,
    required this.onProject,
  });
  @override State<_AdvancedFields> createState() => _AdvancedFieldsState();
}

class _AdvancedFieldsState extends State<_AdvancedFields> {
  late final _firstStepCtrl = TextEditingController(text: widget.firstStep);
  late final _intentionCtrl = TextEditingController(text: widget.intention);

  @override
  void dispose() {
    _firstStepCtrl.dispose();
    _intentionCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final projects = context.watch<ProjectsProvider>().projects;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _SectionLabel('PROJECT'),
      const SizedBox(height: 6),
      Wrap(spacing: 6, runSpacing: 6, children: [
        _Pill(label: 'None', selected: widget.projectId == null, color: Colors.grey, onTap: () => widget.onProject(null)),
        ...projects.map((p) => _Pill(label: p.name, selected: widget.projectId == p.id, color: Color(p.color), onTap: () => widget.onProject(p.id))),
      ]),
      const SizedBox(height: 14),
      _SectionLabel('ESTIMATE'),
      const SizedBox(height: 6),
      Wrap(spacing: 6, runSpacing: 6, children: [
        for (final m in [15, 25, 45, 60, 90]) _Pill(label: m < 60 ? '${m}m' : (m == 60 ? '1h' : '${m ~/ 60}h ${m % 60}m'), selected: widget.estimate == m, color: AppTheme.primary, onTap: () => widget.onEstimate(m)),
        if (widget.estimate != null) _Pill(label: 'Clear', selected: false, color: AppTheme.danger, onTap: () => widget.onEstimate(null)),
      ]),
      const SizedBox(height: 14),
      _SectionLabel('FIRST MICRO-STEP'),
      const SizedBox(height: 6),
      TextField(
        controller: _firstStepCtrl,
        style: const TextStyle(fontSize: 14, height: 1.4),
        decoration: InputDecoration(
          hintText: 'The smallest first action…',
          prefixIcon: const Icon(Icons.play_arrow_rounded, size: 18, color: AppTheme.primary),
          filled: true, fillColor: AppTheme.primary.withValues(alpha: 0.05),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        ),
        onChanged: widget.onFirstStep,
      ),
      const SizedBox(height: 14),
      _SectionLabel('WHEN/WHERE TRIGGER'),
      const SizedBox(height: 6),
      TextField(
        controller: _intentionCtrl,
        style: const TextStyle(fontSize: 14, height: 1.4),
        decoration: InputDecoration(
          hintText: 'When X, I will Y at Z…',
          prefixIcon: const Icon(Icons.bolt_outlined, size: 18, color: Colors.amber),
          filled: true, fillColor: Colors.amber.withValues(alpha: 0.05),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        ),
        onChanged: widget.onIntention,
      ),
    ]);
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;
  const _Pill({required this.label, required this.selected, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true, selected: selected, label: label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: selected ? color : Colors.transparent,
            border: Border.all(color: selected ? color : Theme.of(context).dividerColor, width: 1.5),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(child: Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: selected ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? AppTheme.darkText : AppTheme.lightText))),
        ),
      ),
    ),
    );
  }
}

enum _QuickAddType { note, task, mit }

class _QuickAddResult {
  final _QuickAddType type;
  final String text;
  final String? id;
  _QuickAddResult({required this.type, required this.text, this.id});
}

Future<void> showQuickAdd(BuildContext context, {String? prefill, bool defaultToMIT = false, QuickAddType initialType = QuickAddType.auto}) async {
  HapticFeedback.lightImpact();
  final result = await showAppSheet<_QuickAddResult>(
    context: context,
    builder: (_) => QuickAddSheet(prefill: prefill, defaultToMIT: defaultToMIT, initialType: initialType),
  );
  if (result == null) return;
  if (!context.mounted) return;
  final typeLabel = result.type == _QuickAddType.mit ? 'MIT ' : (result.type == _QuickAddType.task ? 'Task ' : 'Note ');
  ScaffoldMessenger.of(context).clearSnackBars();
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Row(children: [
        Icon(result.type == _QuickAddType.mit ? Icons.star_rounded : (result.type == _QuickAddType.task ? Icons.check_rounded : Icons.note_alt_rounded), color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text('${typeLabel}added', style: const TextStyle(fontWeight: FontWeight.w600))),
      ]),
      duration: const Duration(seconds: 2),
    ),
  );
}
