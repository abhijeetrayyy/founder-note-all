import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/notes_provider.dart';
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final weekAgo = DateTime.now().subtract(const Duration(days: 7));
    final completedThisWeek = tasks.tasks.where((t) => t.completed && t.updatedAt.isAfter(weekAgo)).toList();
    final pending = tasks.active;
    final recentNotes = notes.notes.where((n) => n.updatedAt.isAfter(weekAgo)).toList();

    final steps = [
      _ReviewStep(title: 'What got done', child: Column(children: [
        Text('${completedThisWeek.length} tasks completed this week', style: TextStyle(fontSize: 16, color: Colors.green)),
        const SizedBox(height: 12),
        if (completedThisWeek.isNotEmpty) ...completedThisWeek.map((t) => ListTile(dense: true, leading: const Icon(Icons.check_circle, color: Colors.green, size: 18), title: Text(t.title))),
        if (completedThisWeek.isEmpty) Text('No tasks completed this week. Time to focus!', style: TextStyle(color: Colors.grey.shade500)),
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
