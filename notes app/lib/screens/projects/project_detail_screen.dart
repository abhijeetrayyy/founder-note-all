import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/note.dart';
import '../../models/task.dart';
import '../../providers/projects_provider.dart';
import '../../providers/notes_provider.dart';
import '../../providers/tasks_provider.dart';
import '../../theme/app_theme.dart';
import '../notes/note_editor_screen.dart';
import '../tasks/task_editor_screen.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;
  const ProjectDetailScreen({super.key, required this.projectId});

  @override State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final projects = context.watch<ProjectsProvider>().projects;
    final project = projects.where((p) => p.id == widget.projectId).firstOrNull;
    if (project == null) return Scaffold(appBar: AppBar(title: const Text('Not found')), body: const Center(child: Text('Project not found')));

    final notes = context.watch<NotesProvider>().notes.where((n) => n.projectId == widget.projectId).toList();
    final tasks = context.watch<TasksProvider>().tasks.where((t) => t.projectId == widget.projectId && !t.completed).toList();
    final color = Color(project.color);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: Text(project.name)),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(20)), child: Row(children: [
          Container(width: 56, height: 56, decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),           child: Icon(project.icon, color: color, size: 28)),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(project.name, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1A1A2E))), if (project.description.isNotEmpty) Text(project.description, style: TextStyle(color: Colors.grey.shade600))])),
        ])),
        const SizedBox(height: 28),
        Row(children: [
          const Text('Tasks', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(width: 8),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)), child: Text('${tasks.length}', style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600))),
          const Spacer(),
          TextButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TaskEditorScreen())).then((_) { context.read<TasksProvider>().load(); }), icon: const Icon(Icons.add, size: 18), label: const Text('Add')),
        ]),
        if (tasks.isEmpty) _empty('No tasks in this project') else ...tasks.map((t) => _taskRow(t)),
        const SizedBox(height: 28),
        Row(children: [
          const Text('Notes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(width: 8),
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)), child: Text('${notes.length}', style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600))),
          const Spacer(),
          TextButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NoteEditorScreen())).then((_) => context.read<NotesProvider>().load()), icon: const Icon(Icons.add, size: 18), label: const Text('Add')),
        ]),
        if (notes.isEmpty) _empty('No notes in this project') else ...notes.map((n) => _noteRow(n)),
        const SizedBox(height: 80),
      ]),
    );
  }

  Widget _empty(String t) => Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(14)), child: Center(child: Text(t, style: TextStyle(color: Colors.grey.shade500))));

  Widget _taskRow(Task task) {
    return ListTile(
      leading: GestureDetector(onTap: () => context.read<TasksProvider>().toggle(task.id), child: Icon(task.completed ? Icons.check_circle : Icons.radio_button_unchecked, color: task.completed ? Colors.grey : task.priorityColor, size: 22)),
      title: Text(task.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(decoration: task.completed ? TextDecoration.lineThrough : null)),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TaskEditorScreen(taskId: task.id))).then((_) => context.read<TasksProvider>().load()),
    );
  }

  Widget _noteRow(Note note) {
    return ListTile(
      leading: Icon(Icons.note_alt_outlined, color: Color(note.color), size: 22),
      title: Text(note.title.isEmpty ? 'Untitled' : note.title, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: note.content.isNotEmpty ? Text(note.content, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)) : null,
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NoteEditorScreen(noteId: note.id))).then((_) => context.read<NotesProvider>().load()),
    );
  }
}
