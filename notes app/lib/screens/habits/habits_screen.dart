import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/habit_provider.dart';

class HabitsScreen extends StatefulWidget {
  const HabitsScreen({super.key});
  @override State<HabitsScreen> createState() => _HabitsScreenState();
}

class _HabitsScreenState extends State<HabitsScreen> {
  final _name = TextEditingController();

  @override void dispose() { _name.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final p = context.watch<HabitProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Habits')),
      body: p.habits.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.auto_awesome, size: 48, color: Colors.grey.shade400), const SizedBox(height: 12), const Text('No habits yet', style: TextStyle(color: Colors.grey, fontSize: 16)), const SizedBox(height: 4), const Text('Build daily routines', style: TextStyle(color: Colors.grey, fontSize: 13))]))
          : ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 80), children: p.habits.map((h) {
              final done = p.isDone(h.id);
              return GestureDetector(
                onTap: () => p.toggle(h.id),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(14)),
                  child: Row(children: [
                    Container(width: 40, height: 40, decoration: BoxDecoration(color: done ? Color(h.color) : Color(h.color).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)), child: Icon(h.icon, color: done ? Colors.white : Color(h.color), size: 20)),
                    const SizedBox(width: 12),
                    Expanded(child: Text(h.name, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, decoration: done ? TextDecoration.lineThrough : null, color: done ? Colors.grey : (isDark ? Colors.white : const Color(0xFF1A1A2E))))),
                    if (done) const Icon(Icons.check_circle, color: Colors.green, size: 24),
                  ]),
                ),
              );
            }).toList()),
      floatingActionButton: FloatingActionButton(onPressed: () => _showAdd(), child: const Icon(Icons.add_rounded)),
    );
  }

  void _showAdd() {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text('New Habit'),
      content: TextField(controller: _name, autofocus: true, decoration: const InputDecoration(hintText: 'Habit name')),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () { if (_name.text.trim().isNotEmpty) { context.read<HabitProvider>().add(name: _name.text.trim()); _name.clear(); Navigator.pop(ctx); } }, child: const Text('Add')),
      ],
    ));
  }
}
