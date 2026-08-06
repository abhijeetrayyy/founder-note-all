import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/notes_provider.dart';
import '../../providers/goals_provider.dart';
import '../../providers/journal_provider.dart';
import '../../theme/app_theme.dart';

class WeeklyReviewScreen extends StatefulWidget {
  const WeeklyReviewScreen({super.key});
  @override State<WeeklyReviewScreen> createState() => _WeeklyReviewScreenState();
}

class _WeeklyReviewScreenState extends State<WeeklyReviewScreen> {
  final _notes = TextEditingController(), _next = TextEditingController();
  int _step = 0;

  @override void dispose() { _notes.dispose(); _next.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final goals = context.watch<GoalsProvider>();
    final journal = context.watch<JournalProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final weekAgo = DateTime.now().subtract(const Duration(days: 7));
    final completedThisWeek = tasks.tasks.where((t) => t.completed && t.updatedAt.isAfter(weekAgo)).toList();
    final pending = tasks.active;
    final recentNotes = notes.notes.where((n) => n.updatedAt.isAfter(weekAgo)).toList();
    final recentJournal = journal.entries.where((e) => e.createdAt.isAfter(weekAgo)).toList();
    final activeGoals = goals.goals.where((g) => !g.archived).toList();

    final steps = [
      _ReviewStep(title: 'This week\'s summary', child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: isDark ? AppTheme.darkSurfaceAlt : AppTheme.lightSurfaceAlt, borderRadius: BorderRadius.circular(16)),
          child: Column(children: [
            Row(children: [
              _StatCard(label: 'Completed', value: '${completedThisWeek.length}', color: AppTheme.success),
              const SizedBox(width: 10),
              _StatCard(label: 'Still open', value: '${pending.length}', color: AppTheme.warning),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              _StatCard(label: 'Notes', value: '${recentNotes.length}', color: AppTheme.primary),
              const SizedBox(width: 10),
              _StatCard(label: 'Journal', value: '${recentJournal.length}', color: AppTheme.energyAdmin),
            ]),
          ]),
        ),
        if (activeGoals.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Goal progress', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkText : AppTheme.lightText)),
          const SizedBox(height: 8),
          ...activeGoals.map((g) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              Expanded(child: Text(g.title, style: const TextStyle(fontSize: 13))),
              Text('${g.progress}%', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(g.color))),
              const SizedBox(width: 8),
              SizedBox(
                width: 60,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(value: g.progress / 100, color: Color(g.color), backgroundColor: Color(g.color).withValues(alpha: 0.12)),
                ),
              ),
            ]),
          )),
        ],
        if (recentJournal.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Recent journal', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? AppTheme.darkText : AppTheme.lightText)),
          const SizedBox(height: 8),
          ...recentJournal.take(3).map((e) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(children: [
              Text(_moodEmoji(e.mood), style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Expanded(child: Text(e.content, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted))),
            ]),
          )),
        ],
      ])),
      _ReviewStep(title: 'What got done', child: Column(children: [
        Text('${completedThisWeek.length} tasks completed this week', style: const TextStyle(fontSize: 16, color: AppTheme.success)),
        const SizedBox(height: 12),
        if (completedThisWeek.isNotEmpty) ...completedThisWeek.map((t) => ListTile(dense: true, leading: const Icon(Icons.check_circle, color: AppTheme.success, size: 18), title: Text(t.title))),
        if (completedThisWeek.isEmpty) Text('No tasks completed this week. Time to focus!', style: TextStyle(color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted)),
      ])),
      _ReviewStep(title: 'What\'s pending', child: Column(children: [
        Text('${pending.length} active tasks', style: TextStyle(fontSize: 16, color: Colors.orange)),
        const SizedBox(height: 12),
        if (pending.isNotEmpty) ...pending.take(10).map((t) => ListTile(dense: true, leading: Icon(Icons.radio_button_unchecked, color: t.priorityColor, size: 18), title: Text(t.title), subtitle: t.dueDate != null ? Text('Due ${DateFormat('MMM d').format(t.dueDate!)}') : null)),
        if (pending.isEmpty) Text('All clear! ', style: TextStyle(color: Colors.grey.shade500)),
      ])),
      _ReviewStep(title: 'Recent notes', child: Column(children: [
        Text('${recentNotes.length} notes this week', style: TextStyle(fontSize: 16, color: AppTheme.primary)),
        const SizedBox(height: 12),
        if (recentNotes.isNotEmpty) ...recentNotes.take(5).map((n) => ListTile(dense: true, leading: Icon(Icons.note_alt_outlined, color: Color(n.color), size: 18), title: Text(n.title.isEmpty ? 'Untitled' : n.title))),
      ])),
      _ReviewStep(title: 'Plan next week', child: Column(children: [
        TextField(controller: _notes, maxLines: 4, decoration: InputDecoration(hintText: 'What\'s your focus for next week?', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 16),
        TextField(controller: _next, maxLines: 3, decoration: InputDecoration(hintText: 'Top 3 priorities...', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
      ])),
    ];

    final step = steps[_step.clamp(0, steps.length - 1)];

    return Scaffold(
      appBar: AppBar(title: const Text('Weekly Review')),
      body: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
        Row(children: List.generate(steps.length, (i) => Expanded(child: Container(margin: const EdgeInsets.symmetric(horizontal: 2), height: 3, decoration: BoxDecoration(color: i <= _step ? AppTheme.primary : Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))))),
        const SizedBox(height: 24),
        Text('Step ${_step + 1} of ${steps.length}', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
        const SizedBox(height: 8),
        Text(step.title, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
        const SizedBox(height: 20),
        Expanded(child: step.child),
        const SizedBox(height: 20),
        Row(children: [
          if (_step > 0) TextButton(onPressed: () => setState(() => _step--), child: const Text('Back')),
          const Spacer(),
          FilledButton(onPressed: () {
            if (_step < steps.length - 1) { setState(() => _step++); }
            else { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Weekly review complete! '))); Navigator.pop(context); }
          }, child: Text(_step < steps.length - 1 ? 'Next' : 'Finish')),
        ]),
      ])),
    );
  }
}

class _ReviewStep {
  final String title; final Widget child;
  const _ReviewStep({required this.title, required this.child});
}

String _moodEmoji(int mood) {
  const emojis = ['😊', '😐', '🤔', '😤', '😴'];
  return emojis[mood.clamp(0, emojis.length - 1)];
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: isDark ? 0.12 : 0.06),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(children: [
          Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: color, letterSpacing: -0.5)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isDark ? AppTheme.darkTextMuted : AppTheme.lightTextMuted, letterSpacing: 0.3)),
        ]),
      ),
    );
  }
}
