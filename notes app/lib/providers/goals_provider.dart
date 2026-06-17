import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/goal.dart';
import '../services/database_service.dart';

class GoalsProvider extends ChangeNotifier {
  final _db = DatabaseService.instance;
  final _uuid = const Uuid();
  List<Goal> _goals = [];

  List<Goal> get goals => _goals.where((g) => !g.archived).toList();
  List<Goal> get archived => _goals.where((g) => g.archived).toList();
  int get count => _goals.where((g) => !g.archived).length;

  Future<void> load() async {
    _goals = await _db.getGoals();
    notifyListeners();
  }

  Future<Goal> add({required String title, String description = '', int color = 0xFF6C63FF, int iconIndex = 0}) async {
    final g = Goal(id: _uuid.v4(), title: title, description: description, color: color, iconIndex: iconIndex);
    await _db.insertGoal(g);
    _goals.add(g);
    notifyListeners();
    return g;
  }

  Future<void> update(String id, {String? title, String? description, int? color, int? iconIndex, bool? archived}) async {
    final i = _goals.indexWhere((g) => g.id == id);
    if (i == -1) return;
    final u = _goals[i].copyWith(title: title, description: description, color: color, iconIndex: iconIndex, archived: archived);
    await _db.updateGoal(u);
    _goals[i] = u;
    notifyListeners();
  }

  Future<void> remove(String id) async {
    await _db.deleteGoal(id);
    _goals.removeWhere((g) => g.id == id);
    notifyListeners();
  }
}
