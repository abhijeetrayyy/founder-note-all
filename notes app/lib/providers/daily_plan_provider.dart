import 'package:flutter/foundation.dart';
import '../models/daily_plan.dart';
import '../services/database_service.dart';

class DailyPlanProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;

  DailyPlan? _todayPlan;
  List<DailyPlan> _recentPlans = [];

  DailyPlan? get todayPlan => _todayPlan;
  List<DailyPlan> get recentPlans => _recentPlans;

  String get todayId => DateTime.now().toIso8601String().substring(0, 10);

  bool get hasPlannedToday => _todayPlan != null && _todayPlan!.morningDone;
  List<String> get todayMITs => _todayPlan?.mitTaskIds ?? [];

  Future<void> load() async {
    _todayPlan = await _db.getDailyPlan(todayId);
    _recentPlans = await _db.getRecentDailyPlans(limit: 7);
    notifyListeners();
  }

  Future<void> savePlan({
    required List<String> mitTaskIds,
    required String intentionText,
    required String blockerNotes,
  }) async {
    final existing = _todayPlan;
    final plan = DailyPlan(
      id: todayId,
      mitTaskIds: mitTaskIds,
      intentionText: intentionText,
      blockerNotes: blockerNotes,
      morningDone: true,
      createdAt: existing?.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );
    await _db.upsertDailyPlan(plan);
    _todayPlan = plan;
    _recentPlans = await _db.getRecentDailyPlans(limit: 7);
    notifyListeners();
  }

  Future<void> updateMITs(List<String> mitTaskIds) async {
    if (_todayPlan == null) return;
    final updated = _todayPlan!.copyWith(mitTaskIds: mitTaskIds, updatedAt: DateTime.now());
    await _db.upsertDailyPlan(updated);
    _todayPlan = updated;
    notifyListeners();
  }

  // streak = how many consecutive days had a completed plan
  int get planningStreak {
    int streak = 0;
    final today = DateTime.now();
    for (int i = 0; i < 30; i++) {
      final d = today.subtract(Duration(days: i)).toIso8601String().substring(0, 10);
      final plan = _recentPlans.where((p) => p.id == d).firstOrNull;
      if (plan != null && plan.morningDone) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}
