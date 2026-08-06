import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../providers/goals_provider.dart';
import '../../models/goal_milestone.dart';
import '../../services/database_service.dart';
import '../../theme/app_theme.dart';
import '../widgets/empty_state.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  static const _colors = [0xFF5B4FE9, 0xFF22C55E, 0xFFF59E0B, 0xFFEF4444, 0xFF3B82F6, 0xFFEC4899, 0xFF14B8A6, 0xFF8B5CF6];
  static const _icons = [Icons.flag_rounded, Icons.rocket_launch_rounded, Icons.diamond_rounded, Icons.bolt_rounded, Icons.star_rounded, Icons.local_fire_department_rounded, Icons.trending_up_rounded, Icons.emoji_events_rounded, Icons.psychology_rounded, Icons.favorite_rounded, Icons.lightbulb_rounded, Icons.public_rounded];

  @override State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  String? _expandedGoalId;
  Map<String, List<GoalMilestone>> _milestonesCache = {};
  final _milestoneCtrl = TextEditingController();

  static const _colors = [0xFF5B4FE9, 0xFF22C55E, 0xFFF59E0B, 0xFFEF4444, 0xFF3B82F6, 0xFFEC4899, 0xFF14B8A6, 0xFF8B5CF6];
  static const _icons = [Icons.flag_rounded, Icons.rocket_launch_rounded, Icons.diamond_rounded, Icons.bolt_rounded, Icons.star_rounded, Icons.local_fire_department_rounded, Icons.trending_up_rounded, Icons.emoji_events_rounded, Icons.psychology_rounded, Icons.favorite_rounded, Icons.lightbulb_rounded, Icons.public_rounded];

  @override
  void dispose() {
    _milestoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadMilestones(String goalId) async {
    final ms = await DatabaseService.instance.getMilestonesForGoal(goalId);
    if (!mounted) return;
    setState(() => _milestonesCache[goalId] = ms);
  }

  Future<void> _toggleMilestone(GoalMilestone m) async {
    await DatabaseService.instance.toggleMilestone(m.id, !m.isCompleted);
    await _loadMilestones(m.goalId);
  }

  Future<void> _addMilestone(String goalId) async {
    final text = _milestoneCtrl.text.trim();
    if (text.isEmpty) return;
    final m = GoalMilestone(id: const Uuid().v4(), goalId: goalId, title: text);
    await DatabaseService.instance.insertMilestone(m);
    _milestoneCtrl.clear();
    await _loadMilestones(goalId);
  }

  Future<void> _deleteMilestone(GoalMilestone m) async {
    await DatabaseService.instance.deleteMilestone(m.id);
    await _loadMilestones(m.goalId);
  }

  @override
  Widget build(BuildContext context) {
    final goals = context.watch<GoalsProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(title: const Text('Goals'), actions: [IconButton(icon: const Icon(Icons.add_rounded), onPressed: () => _showGoalSheet(context, null))]),
      body: goals.goals.isEmpty
          ? EmptyState(
              icon: Icons.track_changes_rounded,
              title: 'Set your goals',
              subtitle: 'Goals are the long-term outcomes your daily MITs serve. Pick 1-3 to focus on.',
              actionLabel: 'Add a goal',
              onAction: () => _showGoalSheet(context, null),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text('Top-level outcomes your daily MITs serve.', style: TextStyle(fontSize: 13, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
                ),
                ...goals.goals.map((g) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Dismissible(
                    key: ValueKey(g.id),
                    direction: DismissDirection.endToStart,
                    background: Container(alignment: Alignment.centerRight, padding: const EdgeInsets.symmetric(horizontal: 20), decoration: BoxDecoration(color: AppTheme.danger, borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.delete_rounded, color: Colors.white)),
                    onDismissed: (_) => goals.remove(g.id),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () {
                          if (_expandedGoalId == g.id) {
                            setState(() => _expandedGoalId = null);
                          } else {
                            setState(() => _expandedGoalId = g.id);
                            _loadMilestones(g.id);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Color(g.color).withValues(alpha: 0.3)),
                          ),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(color: Color(g.color).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                                child: Icon(_icons[g.iconIndex % _icons.length], color: Color(g.color)),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(g.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                                  if (g.description.isNotEmpty) ...[const SizedBox(height: 4), Text(g.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, height: 1.4))],
                                ]),
                              ),
                              Text('${g.progress}%', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(g.color))),
                              const SizedBox(width: 4),
                              Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                            ]),
                            const SizedBox(height: 10),
                            SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                trackHeight: 5,
                                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                                overlayShape: const RoundSliderOverlayShape(overlayRadius: 16),
                                activeTrackColor: Color(g.color),
                                inactiveTrackColor: Color(g.color).withValues(alpha: 0.15),
                                thumbColor: Color(g.color),
                              ),
                              child: Slider(
                                value: g.progress.toDouble(),
                                min: 0, max: 100, divisions: 20,
                                onChanged: (v) => context.read<GoalsProvider>().updateProgress(g.id, v.round()),
                              ),
                            ),
                            // ── Milestones (expandable) ──
                            if (_expandedGoalId == g.id) ...[
                              const Divider(height: 24),
                              Text('MILESTONES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.4, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
                              const SizedBox(height: 8),
                              ...(_milestonesCache[g.id] ?? []).map((m) => Container(
                                margin: const EdgeInsets.only(bottom: 4),
                                child: Row(children: [
                                  GestureDetector(
                                    onTap: () => _toggleMilestone(m),
                                    child: Icon(m.isCompleted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, size: 20, color: m.isCompleted ? AppTheme.success : Colors.grey),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(child: Text(m.title, style: TextStyle(fontSize: 14, decoration: m.isCompleted ? TextDecoration.lineThrough : null, color: m.isCompleted ? (isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted) : (isDark ? AppTheme.darkText : AppTheme.lightText)))),
                                  GestureDetector(
                                    onTap: () => _deleteMilestone(m),
                                    child: Icon(Icons.close_rounded, size: 16, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
                                  ),
                                ]),
                              )),
                              const SizedBox(height: 8),
                              Row(children: [
                                Expanded(
                                  child: TextField(
                                    controller: _milestoneCtrl,
                                    textInputAction: TextInputAction.done,
                                    style: const TextStyle(fontSize: 13),
                                    decoration: InputDecoration(
                                      hintText: 'Add milestone...',
                                      isDense: true,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      filled: true,
                                      fillColor: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                                    ),
                                    onSubmitted: (_) => _addMilestone(g.id),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                GestureDetector(
                                  onTap: () => _addMilestone(g.id),
                                  child: Container(
                                    width: 36, height: 36,
                                    decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(10)),
                                    child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                                  ),
                                ),
                              ]),
                            ],
                          ]),
                        ),
                      ),
                    ),
                  ),
                )),
              ],
            ),
    );
  }

  void _showGoalSheet(BuildContext context, String? id) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _GoalEditor(goalId: id),
    );
  }
}

class _GoalEditor extends StatefulWidget {
  final String? goalId;
  const _GoalEditor({this.goalId});
  @override State<_GoalEditor> createState() => _GoalEditorState();
}

class _GoalEditorState extends State<_GoalEditor> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  int _color = 0xFF5B4FE9;
  int _icon = 0;

  @override
  void initState() {
    super.initState();
    if (widget.goalId != null) {
      final g = context.read<GoalsProvider>().goals.where((x) => x.id == widget.goalId).firstOrNull;
      if (g != null) {
        _title.text = g.title;
        _desc.text = g.description;
        _color = g.color;
        _icon = g.iconIndex;
      }
    }
  }

  @override
  void dispose() { _title.dispose(); _desc.dispose(); super.dispose(); }

  Future<void> _save() async {
    final t = _title.text.trim();
    if (t.isEmpty) return;
    final p = context.read<GoalsProvider>();
    if (widget.goalId == null) {
      await p.add(title: t, description: _desc.text.trim(), color: _color, iconIndex: _icon);
    } else {
      await p.update(widget.goalId!, title: t, description: _desc.text.trim(), color: _color, iconIndex: _icon);
    }
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            Text(widget.goalId == null ? 'New Goal' : 'Edit Goal', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            TextField(controller: _title, autofocus: true, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700), decoration: const InputDecoration(hintText: 'e.g. Close the seed round', border: InputBorder.none, contentPadding: EdgeInsets.zero)),
            const SizedBox(height: 12),
            TextField(controller: _desc, maxLines: 3, style: const TextStyle(fontSize: 14, height: 1.5), decoration: const InputDecoration(hintText: 'Why this matters (optional)', border: InputBorder.none)),
            const SizedBox(height: 20),
            const Text('COLOR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.lightTextMuted, letterSpacing: 1.4)),
            const SizedBox(height: 10),
            Wrap(spacing: 10, runSpacing: 10, children: GoalsScreen._colors.map((c) => GestureDetector(
              onTap: () => setState(() => _color = c),
              child: Container(
                width: 36, height: 36,
                decoration: BoxDecoration(color: Color(c), shape: BoxShape.circle, border: _color == c ? Border.all(color: Colors.white, width: 3) : null, boxShadow: _color == c ? [BoxShadow(color: Color(c).withValues(alpha: 0.5), blurRadius: 8)] : null),
              ),
            )).toList()),
            const SizedBox(height: 20),
            const Text('ICON', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.lightTextMuted, letterSpacing: 1.4)),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: List.generate(GoalsScreen._icons.length, (i) => GestureDetector(
              onTap: () => setState(() => _icon = i),
              child: Container(
                width: 42, height: 42,
                decoration: BoxDecoration(color: _icon == i ? Color(_color).withValues(alpha: 0.15) : Colors.transparent, borderRadius: BorderRadius.circular(10), border: Border.all(color: _icon == i ? Color(_color) : Theme.of(context).dividerColor, width: _icon == i ? 2 : 1)),
                child: Icon(GoalsScreen._icons[i], size: 20, color: _icon == i ? Color(_color) : Theme.of(context).brightness == Brightness.dark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted),
              ),
            ))),
            const SizedBox(height: 24),
            SizedBox(width: double.infinity, child: FilledButton.icon(onPressed: _save, icon: const Icon(Icons.check_rounded, size: 18), label: const Text('Save Goal'))),
          ]),
        ),
      ),
    );
  }
}
