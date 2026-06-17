import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/journal_entry.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/notes_provider.dart';
import '../../providers/habit_provider.dart';
import '../../providers/journal_provider.dart';
import '../../providers/daily_plan_provider.dart';
import '../../theme/app_theme.dart';

class StatsScreen extends StatelessWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final habits = context.watch<HabitProvider>();
    final journal = context.watch<JournalProvider>();
    final plans = context.watch<DailyPlanProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final totalTasks = tasks.tasks.length;
    final completed = tasks.tasks.where((t) => t.completed).length;
    final rate = totalTasks > 0 ? ((completed / totalTasks) * 100).round() : 0;
    final today = tasks.todayTasks.length;
    final habitDone = habits.todayStatus.values.where((v) => v).length;

    // MIT completion rate: how many MITs in the last 7 plans are completed
    final recentPlans = plans.recentPlans.take(7).toList();
    int mitPlanned = 0;
    int mitDone = 0;
    for (final p in recentPlans) {
      for (final id in p.mitTaskIds) {
        final t = tasks.taskById(id);
        if (t == null) continue;
        mitPlanned++;
        if (t.completed) mitDone++;
      }
    }
    final mitRate = mitPlanned == 0 ? 0 : ((mitDone / mitPlanned) * 100).round();

    // Estimation accuracy: of tasks with estimates that are completed, what's the
    // ratio of "actual < estimate" vs overdue. Without time tracking, we use
    // a proxy: tasks with firstStep that got done are more likely to be
    // accurately estimated. The honest metric: avg estimate vs avg priority
    // adjusted. We'll show: distribution of estimates + % tasks estimated.
    final estimatedCount = tasks.tasks.where((t) => t.estimatedMinutes != null).length;
    final estimateRate = totalTasks == 0 ? 0 : ((estimatedCount / totalTasks) * 100).round();
    final avgEstimate = estimatedCount == 0
        ? 0
        : (tasks.tasks.where((t) => t.estimatedMinutes != null).fold<int>(0, (s, t) => s + t.estimatedMinutes!) / estimatedCount).round();

    // First-step adoption (proxy for "did you make the task easier to start?")
    final firstStepCount = tasks.tasks.where((t) => t.firstStep.isNotEmpty).length;
    final firstStepRate = totalTasks == 0 ? 0 : ((firstStepCount / totalTasks) * 100).round();

    // Energy distribution
    final byEnergy = [0, 0, 0];
    for (final t in tasks.tasks) {
      byEnergy[t.energyLevel.clamp(0, 2)]++;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Statistics')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        // Top KPI row
        Row(children: [
          _StatBox(label: 'Tasks', value: '$totalTasks', sub: '$completed done', color: Colors.blue, isDark: isDark),
          const SizedBox(width: 10),
          _StatBox(label: 'Rate', value: '$rate%', sub: 'completion', color: Colors.green, isDark: isDark),
          const SizedBox(width: 10),
          _StatBox(label: 'Today', value: '$today', sub: 'due tasks', color: Colors.orange, isDark: isDark),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          _StatBox(label: 'Notes', value: '${notes.count}', sub: 'total', color: AppTheme.primary, isDark: isDark),
          const SizedBox(width: 10),
          _StatBox(label: 'Habits', value: '$habitDone', sub: 'done today', color: Colors.purple, isDark: isDark),
          const SizedBox(width: 10),
          _StatBox(label: 'Journal', value: '${journal.streak}', sub: 'day streak', color: Colors.teal, isDark: isDark),
        ]),

        const SizedBox(height: 28),
        // MIT Execution (the headline metric)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkSurface : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.wb_sunny_rounded, size: 18, color: AppTheme.primary),
              const SizedBox(width: 6),
              Text('MIT EXECUTION', style: TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
              const Spacer(),
              Text('Last ${recentPlans.length} day${recentPlans.length == 1 ? "" : "s"}', style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
            ]),
            const SizedBox(height: 14),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('$mitRate%', style: TextStyle(fontSize: 42, fontWeight: FontWeight.w800, height: 1, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
              const SizedBox(width: 6),
              Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('MITs completed', style: TextStyle(fontSize: 13, color: Colors.grey.shade600, fontWeight: FontWeight.w600))),
            ]),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: mitRate / 100,
                minHeight: 8,
                backgroundColor: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.05),
                valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
              ),
            ),
            const SizedBox(height: 10),
            Text('$mitDone of $mitPlanned MITs across the last ${recentPlans.length} planned days.',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
            const SizedBox(height: 16),
            // Per-day mini visualization
            const SizedBox(height: 4),
            _MITDayStrip(plans: recentPlans, isDark: isDark),
          ]),
        ),

        const SizedBox(height: 28),
        Text('Estimation Discipline', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
        const SizedBox(height: 4),
        Text('Tasks with realistic time estimates beat wishful thinking.',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: _MiniStat(label: 'Tasks with estimate', value: '$estimateRate%', color: Colors.blue, isDark: isDark)),
          const SizedBox(width: 10),
          Expanded(child: _MiniStat(label: 'Avg estimate', value: avgEstimate == 0 ? '—' : '${avgEstimate}m', color: Colors.indigo, isDark: isDark)),
          const SizedBox(width: 10),
          Expanded(child: _MiniStat(label: 'With first-step', value: '$firstStepRate%', color: AppTheme.primary, isDark: isDark)),
        ]),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: isDark ? AppTheme.darkSurface : Colors.white, borderRadius: BorderRadius.circular(14)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.timer_outlined, size: 18, color: Colors.indigo),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                "Reality-check: the system will compare your future estimates to your historical average. Use ±30–50% padding until you have 20+ data points.",
                style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700, height: 1.5),
              ),
            ),
          ]),
        ),

        const SizedBox(height: 28),
        Text('Energy Distribution', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
        const SizedBox(height: 12),
        _EnergyBar(admin: byEnergy[0], medium: byEnergy[1], deep: byEnergy[2], isDark: isDark),

        const SizedBox(height: 28),
        Text('Completion by Priority', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
        const SizedBox(height: 12),
        ...['High', 'Medium', 'Low'].map((label) {
          final pIdx = ['High', 'Medium', 'Low'].indexOf(label);
          final total = tasks.tasks.where((t) => t.priority == 2 - pIdx).length;
          final done = tasks.tasks.where((t) => t.priority == 2 - pIdx && t.completed).length;
          final pct = total > 0 ? (done / total * 100).round() : 0;
          final color = [Colors.red, Colors.orange, Colors.green][pIdx];
          return Padding(padding: const EdgeInsets.only(bottom: 8), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Text(label, style: TextStyle(fontSize: 13, color: isDark ? Colors.white70 : Colors.black87)), const Spacer(), Text('$done / $total', style: TextStyle(fontSize: 12, color: Colors.grey.shade500))]),
            const SizedBox(height: 4),
            ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: pct / 100, minHeight: 8, backgroundColor: Colors.grey.shade200, color: color)),
          ]));
        }),

        const SizedBox(height: 28),
        Text('Journal Moods', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: List.generate(5, (i) {
          final count = journal.entries.where((e) => e.mood == i).length;
          return Column(children: [Text(JournalEntry.moodEmojis[i], style: const TextStyle(fontSize: 28)), Text('$count', style: TextStyle(fontSize: 12, color: Colors.grey.shade500))]);
        })),
        const SizedBox(height: 32),
      ]),
    );
  }
}

class _MITDayStrip extends StatelessWidget {
  final List plans;
  final bool isDark;
  const _MITDayStrip({required this.plans, required this.isDark});

  @override
  Widget build(BuildContext context) {
    if (plans.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(10)),
        child: Text('No plans yet. Run a morning ritual to start tracking.', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
      );
    }
    return Row(children: [
      for (final p in plans)
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: _DayPill(plan: p, isDark: isDark),
          ),
        ),
    ]);
  }
}

class _DayPill extends StatelessWidget {
  final dynamic plan;
  final bool isDark;
  const _DayPill({required this.plan, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final done = plan.mitTaskIds.length;
    final allDone = done > 0;
    final color = allDone ? Colors.green : (done == 0 ? Colors.grey.shade300 : AppTheme.primary);
    final dayLabel = plan.id.toString().substring(8, 10);
    return Column(children: [
      Container(
        height: 36,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Center(child: Text('$done', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12))),
      ),
      const SizedBox(height: 4),
      Text(dayLabel, style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
    ]);
  }
}

class _EnergyBar extends StatelessWidget {
  final int admin, medium, deep;
  final bool isDark;
  const _EnergyBar({required this.admin, required this.medium, required this.deep, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final total = admin + medium + deep;
    if (total == 0) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: isDark ? AppTheme.darkSurface : Colors.white, borderRadius: BorderRadius.circular(14)),
        child: Text('No tasks yet.', style: TextStyle(color: Colors.grey.shade500)),
      );
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: isDark ? AppTheme.darkSurface : Colors.white, borderRadius: BorderRadius.circular(14)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            height: 16,
            child: Row(children: [
              if (admin > 0) Expanded(flex: admin, child: Container(color: Colors.teal)),
              if (medium > 0) Expanded(flex: medium, child: Container(color: Colors.blue)),
              if (deep > 0) Expanded(flex: deep, child: Container(color: Colors.deepPurple)),
            ]),
          ),
        ),
        const SizedBox(height: 14),
        Row(children: [
          _LegendDot(color: Colors.teal, label: 'Admin', count: admin, total: total),
          const SizedBox(width: 16),
          _LegendDot(color: Colors.blue, label: 'Medium', count: medium, total: total),
          const SizedBox(width: 16),
          _LegendDot(color: Colors.deepPurple, label: 'Deep', count: deep, total: total),
        ]),
      ]),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  final int count, total;
  const _LegendDot({required this.color, required this.label, required this.count, required this.total});

  @override
  Widget build(BuildContext context) {
    final pct = total == 0 ? 0 : ((count / total) * 100).round();
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 6),
      Text('$label · $count ($pct%)', style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
    ]);
  }
}

class _StatBox extends StatelessWidget {
  final String label, value, sub;
  final Color color;
  final bool isDark;
  const _StatBox({required this.label, required this.value, required this.sub, required this.color, required this.isDark});

  @override
  Widget build(BuildContext context) => Expanded(child: Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(16)),
    child: Column(children: [
      Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
      const SizedBox(height: 4),
      Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
      Text(sub, style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
    ]),
  ));
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color color;
  final bool isDark;
  const _MiniStat({required this.label, required this.value, required this.color, required this.isDark});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(14)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
      const SizedBox(height: 4),
      Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
    ]),
  );
}
