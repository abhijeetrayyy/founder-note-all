import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/project.dart';
import '../../providers/projects_provider.dart';
import '../../providers/notes_provider.dart';
import '../../providers/tasks_provider.dart';
import 'project_detail_screen.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});
  @override State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  final _name = TextEditingController(), _desc = TextEditingController();

  @override void dispose() { _name.dispose(); _desc.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final projects = context.watch<ProjectsProvider>().projects;
    final notes = context.watch<NotesProvider>().notes;
    final tasks = context.watch<TasksProvider>().tasks;

    return Scaffold(
      appBar: AppBar(title: const Text('Projects')),
      body: projects.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.folder_outlined, size: 48, color: Colors.grey.shade400), const SizedBox(height: 12), const Text('No projects yet', style: TextStyle(color: Colors.grey, fontSize: 16)), const SizedBox(height: 4), const Text('Create a project to organize your work', style: TextStyle(color: Colors.grey, fontSize: 13))]))
          : ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 80), children: projects.map((p) {
              final nc = notes.where((n) => n.projectId == p.id).length;
              final tc = tasks.where((t) => t.projectId == p.id && !t.completed).length;
              return _ProjectCard(project: p, noteCount: nc, taskCount: tc, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProjectDetailScreen(projectId: p.id))).then((_) { context.read<ProjectsProvider>().load(); context.read<NotesProvider>().load(); context.read<TasksProvider>().load(); }));
            }).toList()),
      floatingActionButton: FloatingActionButton(onPressed: _showCreate, child: const Icon(Icons.add_rounded)),
    );
  }

  void _showCreate() {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text('New Project'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: _name, decoration: const InputDecoration(hintText: 'Project name')),
        const SizedBox(height: 12),
        TextField(controller: _desc, decoration: const InputDecoration(hintText: 'Description (optional)')),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        FilledButton(onPressed: () { if (_name.text.trim().isNotEmpty) { context.read<ProjectsProvider>().add(name: _name.text.trim(), description: _desc.text.trim()); _name.clear(); _desc.clear(); Navigator.pop(ctx); } }, child: const Text('Create')),
      ],
    ));
  }
}

class _ProjectCard extends StatelessWidget {
  final Project project;
  final int noteCount, taskCount;
  final VoidCallback onTap;

  const _ProjectCard({required this.project, required this.noteCount, required this.taskCount, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = Color(project.color);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: isDark ? const Color(0xFF1E1E2C) : Colors.white, borderRadius: BorderRadius.circular(16)),
        child: Row(children: [
          Container(width: 46, height: 46, decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(14)),               child: Icon(project.icon, color: color, size: 24)),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(project.name, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: isDark ? Colors.white : const Color(0xFF1A1A2E))),
            if (project.description.isNotEmpty) Text(project.description, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
          ])),
          Column(children: [
            Text('$noteCount', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const Text('notes', style: TextStyle(fontSize: 10, color: Colors.grey)),
          ]),
          const SizedBox(width: 16),
          Column(children: [
            Text('$taskCount', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const Text('tasks', style: TextStyle(fontSize: 10, color: Colors.grey)),
          ]),
        ]),
      ),
    );
  }
}
