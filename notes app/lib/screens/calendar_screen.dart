import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/tasks_provider.dart';
import '../providers/notes_provider.dart';
import '../providers/journal_provider.dart';
import '../models/task.dart';
import '../theme/app_theme.dart';
import 'tasks/task_editor_screen.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});
  @override State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  late DateTime _currentMonth;
  DateTime? _selectedDay;

  @override void initState() { super.initState(); _currentMonth = DateTime(DateTime.now().year, DateTime.now().month); _selectedDay = DateTime.now(); }

  void _prevMonth() => setState(() => _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1));
  void _nextMonth() => setState(() => _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1));

  @override
  Widget build(BuildContext context) {
    final tasks = context.watch<TasksProvider>();
    final notes = context.watch<NotesProvider>();
    final journal = context.watch<JournalProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final firstDay = DateTime(_currentMonth.year, _currentMonth.month, 1);
    final lastDay = DateTime(_currentMonth.year, _currentMonth.month + 1, 0);
    final startOffset = firstDay.weekday % 7;

    final selectedTasks = _selectedDay != null ? tasks.tasksForDate(_selectedDay!) : <Task>[];
    final selectedNotes = _selectedDay != null ? notes.notes.where((n) => n.createdAt.toIso8601String().substring(0, 10) == _selectedDay!.toIso8601String().substring(0, 10)).toList() : [];
    final selectedJournal = _selectedDay != null ? journal.entries.where((e) => e.createdAt.toIso8601String().substring(0, 10) == _selectedDay!.toIso8601String().substring(0, 10)).toList() : [];

    return Scaffold(
      appBar: AppBar(title: Text(DateFormat('MMMM yyyy').format(_currentMonth)), actions: [
        IconButton(icon: const Icon(Icons.chevron_left), onPressed: _prevMonth),
        IconButton(icon: const Icon(Icons.chevron_right), onPressed: _nextMonth),
      ]),
      body: Column(children: [
        _buildMonthGrid(firstDay, lastDay, startOffset, tasks, isDark),
        const Divider(),
        Expanded(child: _selectedDay == null ? const Center(child: Text('Select a day')) : ListView(padding: const EdgeInsets.all(16), children: [
          if (selectedTasks.isNotEmpty) ...[
            Text('Tasks — ${DateFormat('MMM d').format(_selectedDay!)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...selectedTasks.map((t) => _taskRow(t, tasks)),
          ],
          if (selectedNotes.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text('Notes — ${DateFormat('MMM d').format(_selectedDay!)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...selectedNotes.map((n) => ListTile(leading: Icon(Icons.note_alt_outlined, color: Color(n.color)), title: Text(n.title.isEmpty ? 'Untitled' : n.title), subtitle: n.content.isNotEmpty ? Text(n.content, maxLines: 2, overflow: TextOverflow.ellipsis) : null)),
          ],
          if (selectedJournal.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text('Journal — ${DateFormat('MMM d').format(_selectedDay!)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...selectedJournal.map((e) => Container(
              margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(12)),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(e.moodEmoji, style: const TextStyle(fontSize: 18)),
                const SizedBox(width: 10),
                Expanded(child: Text(e.content, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, height: 1.4, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700))),
              ]),
            )),
          ],
          if (selectedTasks.isEmpty && selectedNotes.isEmpty && selectedJournal.isEmpty) Center(child: Padding(padding: const EdgeInsets.all(40), child: Text('Nothing on this day', style: TextStyle(color: Colors.grey.shade500)))),
          const SizedBox(height: 80),
        ])),
      ]),
      floatingActionButton: _selectedDay == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () async {
                await Navigator.push(context, MaterialPageRoute(builder: (_) => TaskEditorScreen(taskId: null, initialDueDate: _selectedDay)));
                if (mounted) context.read<TasksProvider>().load();
              },
              icon: const Icon(Icons.add),
              label: const Text('Add Task'),
            ),
    );
  }

  Widget _buildMonthGrid(DateTime first, DateTime last, int offset, TasksProvider tasks, bool isDark) {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Container(padding: const EdgeInsets.all(12), child: Column(children: [
      Row(children: dayNames.map((d) => Expanded(child: Center(child: Text(d, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey.shade500))))).toList()),
      const SizedBox(height: 6),
      for (int week = 0; week < 6; week++)
        Row(children: List.generate(7, (day) {
          final d = day + week * 7 - offset;
          if (d < 0 || d >= last.day) return const Expanded(child: SizedBox());
          final date = DateTime(first.year, first.month, d + 1);
          final ds = date.toIso8601String().substring(0, 10);
          final hasTasks = tasks.tasksForDate(date).isNotEmpty;
          final isToday = ds == today;
          final isSelected = _selectedDay != null && ds == _selectedDay!.toIso8601String().substring(0, 10);
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedDay = date),
              child: Container(
                margin: const EdgeInsets.all(2),
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primary : (isToday ? AppTheme.primary.withValues(alpha: 0.1) : null),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(children: [
                  Text('${d + 1}', style: TextStyle(fontSize: 13, fontWeight: isToday ? FontWeight.w700 : FontWeight.w400, color: isSelected ? Colors.white : (isToday ? AppTheme.primary : (isDark ? Colors.white70 : Colors.black87)))),
                  if (hasTasks) Container(margin: const EdgeInsets.only(top: 2), width: 6, height: 6, decoration: BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle)),
                ]),
              ),
            ),
          );
        })),
      const SizedBox(height: 8),
      Align(alignment: Alignment.centerRight, child: TextButton.icon(onPressed: () => setState(() { _currentMonth = DateTime(DateTime.now().year, DateTime.now().month); _selectedDay = DateTime.now(); }), icon: const Icon(Icons.today, size: 16), label: const Text('Today', style: TextStyle(fontSize: 12)))),
    ]));
  }

  Widget _taskRow(Task t, TasksProvider p) {
    return GestureDetector(
      onTap: () => p.toggle(t.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Icon(t.completed ? Icons.check_circle : Icons.radio_button_unchecked, size: 18, color: t.completed ? Colors.grey : t.priorityColor),
          const SizedBox(width: 10),
          Expanded(child: Text(t.title, style: TextStyle(decoration: t.completed ? TextDecoration.lineThrough : null, fontSize: 13))),
        ]),
      ),
    );
  }
}
