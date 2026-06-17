import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/project.dart';
import '../services/database_service.dart';

class ProjectsProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final Uuid _uuid = const Uuid();

  List<Project> _projects = [];

  List<Project> get projects => _projects;

  Future<void> load() async {
    _projects = await _db.getProjects();
    notifyListeners();
  }

  Future<void> add({required String name, String description = '', int color = 0xFF6C63FF, int iconIndex = 0}) async {
    final p = Project(id: _uuid.v4(), name: name, description: description, color: color, iconIndex: iconIndex);
    await _db.insertProject(p);
    _projects.add(p);
    _projects.sort((a, b) => a.name.compareTo(b.name));
    notifyListeners();
  }

  Future<void> update({required String id, String? name, String? description, int? color, int? iconIndex}) async {
    final i = _projects.indexWhere((p) => p.id == id);
    if (i == -1) return;
    final p = _projects[i];
    final u = p.copyWith(name: name ?? p.name, description: description ?? p.description, color: color ?? p.color, iconIndex: iconIndex ?? p.iconIndex, updatedAt: DateTime.now());
    await _db.updateProject(u);
    _projects[i] = u;
    notifyListeners();
  }

  Future<void> remove(String id) async {
    await _db.deleteProject(id);
    _projects.removeWhere((p) => p.id == id);
    notifyListeners();
  }

  Project? getById(String id) => _projects.firstWhere((p) => p.id == id, orElse: () => _projects.first);
}
