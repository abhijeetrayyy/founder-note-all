import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/habit.dart';
import '../services/database_service.dart';

class HabitProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final Uuid _uuid = const Uuid();
  List<Habit> _habits = [];
  Map<String, bool> _todayStatus = {};

  List<Habit> get habits => _habits;
  Map<String, bool> get todayStatus => _todayStatus;

  Future<void> load() async {
    _habits = await _db.getHabits();
    _todayStatus = await _db.getTodayHabitStatus();
    notifyListeners();
  }

  Future<void> add({required String name, int color = 0xFF6C63FF, int iconIndex = 0}) async {
    final h = Habit(id: _uuid.v4(), name: name, color: color, iconIndex: iconIndex);
    await _db.insertHabit(h);
    _habits.add(h);
    notifyListeners();
  }

  Future<void> remove(String id) async {
    await _db.deleteHabit(id);
    _habits.removeWhere((h) => h.id == id);
    notifyListeners();
  }

  Future<void> toggle(String id) async {
    final current = _todayStatus[id] ?? false;
    await _db.toggleHabitDone(id, !current);
    _todayStatus[id] = !current;
    notifyListeners();
  }

  bool isDone(String id) => _todayStatus[id] ?? false;
}
