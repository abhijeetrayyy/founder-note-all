import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/task.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/daily_plan_provider.dart';
import '../../theme/app_theme.dart';

class DailyPlanningScreen extends StatefulWidget {
  const DailyPlanningScreen({super.key});
  @override State<DailyPlanningScreen> createState() => _DailyPlanningScreenState();
}

class _DailyPlanningScreenState extends State<DailyPlanningScreen> {
  int _step = 0;
  final _intentionCtrl = TextEditingController();
  final _blockerCtrl = TextEditingController();
  List<String> _selectedMITs = [];

  static const int _totalSteps = 5;

  @override
  void dispose() {
    _intentionCtrl.dispose();
    _blockerCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBg : AppTheme.lightBg,
      body: SafeArea(
        child: Column(
          children: [
            _Header(step: _step, total: _totalSteps, onClose: () => Navigator.pop(context)),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(begin: const Offset(0.04, 0), end: Offset.zero).animate(animation),
                    child: child,
                  ),
                ),
                child: KeyedSubtree(
                  key: ValueKey(_step),
                  child: _buildStep(),
                ),
              ),
            ),
            _Footer(
              step: _step,
              total: _totalSteps,
              canAdvance: _canAdvance(),
              onBack: () => setState(() => _step--),
              onNext: _onNext,
            ),
          ],
        ),
      ),
    );
  }

  bool _canAdvance() {
    if (_step == 2) return _selectedMITs.isNotEmpty;
    return true;
  }

  Widget _buildStep() {
    switch (_step) {
      case 0: return const _StepReflect();
      case 1: return _StepBrainDump(intentionCtrl: _intentionCtrl);
      case 2: return _StepPickMITs(selected: _selectedMITs, onChanged: (ids) => setState(() => _selectedMITs = ids));
      case 3: return _StepAnticipate(blockerCtrl: _blockerCtrl, mits: _selectedMITs);
      case 4: return _StepCommit(mits: _selectedMITs, intention: _intentionCtrl.text, blocker: _blockerCtrl.text);
      default: return const SizedBox.shrink();
    }
  }

  Future<void> _onNext() async {
    if (_step < _totalSteps - 1) {
      setState(() => _step++);
      return;
    }
    // Commit: save the plan + mark selected MITs as non-inbox
    await context.read<DailyPlanProvider>().savePlan(
      mitTaskIds: _selectedMITs,
      intentionText: _intentionCtrl.text.trim(),
      blockerNotes: _blockerCtrl.text.trim(),
    );
    final tasks = context.read<TasksProvider>();
    for (final id in _selectedMITs) {
      final t = tasks.taskById(id);
      if (t != null && t.isInbox) {
        await tasks.setInbox(id, false);
      }
    }
    if (mounted) Navigator.pop(context, true);
  }
}

class _Header extends StatelessWidget {
  final int step, total;
  final VoidCallback onClose;
  const _Header({required this.step, required this.total, required this.onClose});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          GestureDetector(onTap: onClose, child: Icon(Icons.close_rounded, color: Colors.grey.shade500)),
          const Spacer(),
          Text('${step + 1} / $total', style: TextStyle(fontSize: 13, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: (step + 1) / total,
            minHeight: 3,
            backgroundColor: isDark ? Colors.white12 : Colors.black12,
            valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
          ),
        ),
      ]),
    );
  }
}

class _Footer extends StatelessWidget {
  final int step, total;
  final bool canAdvance;
  final VoidCallback onBack, onNext;
  const _Footer({required this.step, required this.total, required this.canAdvance, required this.onBack, required this.onNext});

  @override
  Widget build(BuildContext context) {
    final isLast = step == total - 1;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      child: Row(children: [
        if (step > 0)
          TextButton(
            onPressed: onBack,
            child: const Text('Back'),
          )
        else
          const SizedBox.shrink(),
        const Spacer(),
        FilledButton(
          onPressed: canAdvance ? onNext : null,
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: Text(isLast ? 'Commit to Today' : 'Continue', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
        ),
      ]),
    );
  }
}

// ── Step 0: Reflect ────────────────────────────────────────────────────────
class _StepReflect extends StatelessWidget {
  const _StepReflect();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final h = DateTime.now().hour;
    final greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 36, 28, 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(greeting, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primary, letterSpacing: 0.5)),
        const SizedBox(height: 8),
        Text("Let's plan your day.", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF1A1A2E), height: 1.2)),
        const SizedBox(height: 16),
        Text(
          "Before touching your task list, take 60 seconds to land here. Your brain needs a moment to switch from reactive mode to intentional mode.",
          style: TextStyle(fontSize: 16, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700, height: 1.6),
        ),
        const SizedBox(height: 36),
        _InsightCard(
          icon: Icons.science_rounded,
          title: 'The Science',
          body: 'Research shows that pre-committing to a specific plan — not just a task list — increases follow-through dramatically. The key is choosing fewer things, not more.',
          color: const Color(0xFF6C63FF),
          isDark: isDark,
        ),
        const SizedBox(height: 12),
        _InsightCard(
          icon: Icons.warning_amber_rounded,
          title: 'The Trap',
          body: "A long to-do list creates false productivity. You spend the day switching between tasks and finish feeling busy but not done. Today, we pick 3 things that actually matter.",
          color: Colors.orange,
          isDark: isDark,
        ),
      ]),
    );
  }
}

// ── Step 1: Brain Dump + Intention ────────────────────────────────────────
class _StepBrainDump extends StatelessWidget {
  final TextEditingController intentionCtrl;
  const _StepBrainDump({required this.intentionCtrl});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 36, 28, 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _StepLabel(label: 'INTENTION'),
        const SizedBox(height: 8),
        Text("What is today FOR?", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF1A1A2E), height: 1.2)),
        const SizedBox(height: 12),
        Text(
          "Not what you need to do — what today is about. One word or one sentence. This becomes your compass when you feel pulled in 10 directions.",
          style: TextStyle(fontSize: 15, color: isDark ? Colors.grey.shade300 : Colors.grey.shade600, height: 1.5),
        ),
        const SizedBox(height: 28),
        _BigInput(
          controller: intentionCtrl,
          hint: 'e.g. "Close the funding round" or "Ship v1" or "Rest and recover"',
          maxLines: 3,
          isDark: isDark,
        ),
        const SizedBox(height: 28),
        _InsightCard(
          icon: Icons.lightbulb_outline_rounded,
          title: 'Why this matters',
          body: 'When you hit decision fatigue mid-day, your intention acts as a tiebreaker. It answers "should I take this meeting?" without burning more mental fuel.',
          color: Colors.amber,
          isDark: isDark,
        ),
      ]),
    );
  }
}

// ── Step 2: Pick MITs ─────────────────────────────────────────────────────
class _StepPickMITs extends StatelessWidget {
  final List<String> selected;
  final ValueChanged<List<String>> onChanged;
  const _StepPickMITs({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tasks = context.watch<TasksProvider>();
    final candidates = tasks.active.where((t) => !t.isSubtask).toList()
      ..sort((a, b) => b.priority.compareTo(a.priority));

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(28, 36, 28, 0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _StepLabel(label: 'MOST IMPORTANT TASKS'),
          const SizedBox(height: 8),
          Text("Pick your 3 MITs.", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
          const SizedBox(height: 8),
          Text(
            "These are the 3 things that, if done today, make today a win. Everything else is a bonus. Max 3.",
            style: TextStyle(fontSize: 15, color: isDark ? Colors.grey.shade300 : Colors.grey.shade600, height: 1.5),
          ),
          const SizedBox(height: 6),
          Row(children: [
            ...List.generate(3, (i) => Container(
              width: 10, height: 10, margin: const EdgeInsets.only(right: 6),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: i < selected.length ? AppTheme.primary : (isDark ? Colors.white24 : Colors.grey.shade300),
              ),
            )),
            const SizedBox(width: 4),
            Text('${selected.length}/3 selected', style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
          ]),
          const SizedBox(height: 16),
        ]),
      ),
      Expanded(
        child: candidates.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.check_circle_outline, size: 48, color: Colors.grey.shade400),
                const SizedBox(height: 12),
                Text('No active tasks. Add some first!', style: TextStyle(color: Colors.grey.shade500)),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                itemCount: candidates.length,
                itemBuilder: (_, i) {
                  final t = candidates[i];
                  final isSel = selected.contains(t.id);
                  final isDisabled = !isSel && selected.length >= 3;
                  return _MITPickerTile(
                    task: t,
                    selected: isSel,
                    disabled: isDisabled,
                    isDark: isDark,
                    onTap: () {
                      final next = List<String>.from(selected);
                      if (isSel) {
                        next.remove(t.id);
                      } else if (next.length < 3) {
                        next.add(t.id);
                      }
                      onChanged(next);
                    },
                  );
                },
              ),
      ),
    ]);
  }
}

class _MITPickerTile extends StatelessWidget {
  final Task task;
  final bool selected, disabled, isDark;
  final VoidCallback onTap;
  const _MITPickerTile({required this.task, required this.selected, required this.disabled, required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primary.withValues(alpha: isDark ? 0.2 : 0.08)
              : (isDark ? AppTheme.darkSurface : Colors.white),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppTheme.primary : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Opacity(
          opacity: disabled ? 0.4 : 1.0,
          child: Row(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppTheme.primary : Colors.transparent,
                border: Border.all(color: selected ? AppTheme.primary : Colors.grey.shade400, width: 1.5),
              ),
              child: selected ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(task.title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
              if (task.description.isNotEmpty)
                Text(task.description, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
            ])),
            const SizedBox(width: 8),
            _EnergyBadge(task: task),
            const SizedBox(width: 6),
            Container(
              width: 6, height: 24,
              decoration: BoxDecoration(color: task.priorityColor, borderRadius: BorderRadius.circular(3)),
            ),
          ]),
        ),
      ),
    );
  }
}

// ── Step 3: Anticipate Blockers ────────────────────────────────────────────
class _StepAnticipate extends StatelessWidget {
  final TextEditingController blockerCtrl;
  final List<String> mits;
  const _StepAnticipate({required this.blockerCtrl, required this.mits});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 36, 28, 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _StepLabel(label: 'OBSTACLE AWARENESS'),
        const SizedBox(height: 8),
        Text("What might get in the way?", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF1A1A2E), height: 1.2)),
        const SizedBox(height: 12),
        Text(
          "The best athletes, surgeons, and founders visualize obstacles before they happen. Name it now so it doesn't blindside you at 2pm.",
          style: TextStyle(fontSize: 15, color: isDark ? Colors.grey.shade300 : Colors.grey.shade600, height: 1.5),
        ),
        const SizedBox(height: 28),
        _BigInput(
          controller: blockerCtrl,
          hint: 'e.g. "Slack pinging constantly", "unclear requirements on task 2", "low energy after lunch"',
          maxLines: 4,
          isDark: isDark,
        ),
        const SizedBox(height: 28),
        _InsightCard(
          icon: Icons.shield_outlined,
          title: 'Pre-mortems work',
          body: 'Research on "mental contrasting" shows that identifying obstacles before starting increases goal achievement — not because you get pessimistic, but because you trigger planning for how to handle them.',
          color: Colors.teal,
          isDark: isDark,
        ),
      ]),
    );
  }
}

// ── Step 4: Commit Summary ─────────────────────────────────────────────────
class _StepCommit extends StatelessWidget {
  final List<String> mits;
  final String intention, blocker;
  const _StepCommit({required this.mits, required this.intention, required this.blocker});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final tasks = context.watch<TasksProvider>();

    final mitTasks = mits
        .map((id) => tasks.tasks.where((t) => t.id == id).firstOrNull)
        .whereType<Task>()
        .toList();

    final totalEstimate = mitTasks.fold<int>(0, (sum, t) => sum + (t.estimatedMinutes ?? 30));
    final hours = totalEstimate ~/ 60;
    final mins = totalEstimate % 60;
    final estimateLabel = totalEstimate == 0 ? 'Not estimated' : (hours > 0 ? '~${hours}h ${mins > 0 ? "${mins}m" : ""}' : '~${mins}m');

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(28, 36, 28, 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _StepLabel(label: "TODAY'S COMMITMENT"),
        const SizedBox(height: 8),
        Text("Here's your day.", style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
        const SizedBox(height: 6),
        Text('Commit to this and nothing else is required.', style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
        const SizedBox(height: 28),
        if (intention.isNotEmpty) ...[
          _SummarySection(label: 'INTENTION', isDark: isDark, child: Text(intention, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: isDark ? Colors.white : const Color(0xFF1A1A2E)))),
          const SizedBox(height: 16),
        ],
        _SummarySection(
          label: 'YOUR 3 MITs',
          isDark: isDark,
          trailing: Text(estimateLabel, style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
          child: Column(children: [
            ...mitTasks.asMap().entries.map((e) => _CommitMITRow(index: e.key, task: e.value, isDark: isDark)),
            if (mitTasks.length < 3)
              ...List.generate(3 - mitTasks.length, (_) => _EmptyMITSlot(isDark: isDark)),
          ]),
        ),
        if (blocker.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SummarySection(
            label: 'LIKELY BLOCKER',
            isDark: isDark,
            child: Text(blocker, style: TextStyle(fontSize: 14, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700, height: 1.5)),
          ),
        ],
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: isDark ? 0.15 : 0.07),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.primary.withValues(alpha: 0.25)),
          ),
          child: Row(children: [
            const Icon(Icons.bolt_rounded, color: AppTheme.primary, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(
              'When you finish all 3 MITs, everything else is a bonus. Protect this list from urgency theater.',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : const Color(0xFF1A1A2E), height: 1.5),
            )),
          ]),
        ),
      ]),
    );
  }
}

// ── Shared Widgets ─────────────────────────────────────────────────────────

class _StepLabel extends StatelessWidget {
  final String label;
  const _StepLabel({required this.label});
  @override
  Widget build(BuildContext context) => Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary, letterSpacing: 1.5));
}

class _InsightCard extends StatelessWidget {
  final IconData icon;
  final String title, body;
  final Color color;
  final bool isDark;
  const _InsightCard({required this.icon, required this.title, required this.body, required this.color, required this.isDark});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: color.withValues(alpha: isDark ? 0.12 : 0.06),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: color.withValues(alpha: 0.2)),
    ),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: color, size: 20),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        const SizedBox(height: 4),
        Text(body, style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700, height: 1.5)),
      ])),
    ]),
  );
}

class _BigInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int maxLines;
  final bool isDark;
  const _BigInput({required this.controller, required this.hint, required this.maxLines, required this.isDark});

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    maxLines: maxLines,
    autofocus: false,
    style: TextStyle(fontSize: 16, height: 1.5, color: isDark ? Colors.white : const Color(0xFF1A1A2E)),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 14, height: 1.5),
      filled: true,
      fillColor: isDark ? const Color(0xFF252536) : Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.all(16),
    ),
  );
}

class _SummarySection extends StatelessWidget {
  final String label;
  final bool isDark;
  final Widget child;
  final Widget? trailing;
  const _SummarySection({required this.label, required this.isDark, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
          color: isDark ? AppTheme.darkSurface : Colors.white,
      borderRadius: BorderRadius.circular(14),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey, letterSpacing: 1.2)),
        if (trailing != null) ...[const Spacer(), trailing!],
      ]),
      const SizedBox(height: 12),
      child,
    ]),
  );
}

class _CommitMITRow extends StatelessWidget {
  final int index;
  final Task task;
  final bool isDark;
  const _CommitMITRow({required this.index, required this.task, required this.isDark});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(children: [
      Container(
        width: 24, height: 24,
        decoration: BoxDecoration(shape: BoxShape.circle, color: AppTheme.primary.withValues(alpha: 0.12)),
        child: Center(child: Text('${index + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary))),
      ),
      const SizedBox(width: 10),
      Expanded(child: Text(task.title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? Colors.white : const Color(0xFF1A1A2E)))),
      if (task.estimatedMinutes != null)
        Text(task.estimatedLabel, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
    ]),
  );
}

class _EmptyMITSlot extends StatelessWidget {
  final bool isDark;
  const _EmptyMITSlot({required this.isDark});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(children: [
      Container(
        width: 24, height: 24,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.grey.shade300, width: 1.5)),
      ),
      const SizedBox(width: 10),
      Text('(optional)', style: TextStyle(fontSize: 13, color: Colors.grey.shade400, fontStyle: FontStyle.italic)),
    ]),
  );
}

class _EnergyBadge extends StatelessWidget {
  final Task task;
  const _EnergyBadge({required this.task});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(color: task.energyColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(task.energyIcon, size: 11, color: task.energyColor),
      const SizedBox(width: 3),
      Text(task.energyLabel, style: TextStyle(fontSize: 10, color: task.energyColor, fontWeight: FontWeight.w600)),
    ]),
  );
}
