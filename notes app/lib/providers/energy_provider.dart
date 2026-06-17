import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Energy level for the day (0=low/admin, 1=medium, 2=high/deep).
class EnergyProvider extends ChangeNotifier {
  static const _key = 'energy_level';
  static const _dateKey = 'energy_date';

  int _level = 1;
  DateTime? _checkedAt;

  int get level => _level;
  bool get checkedToday {
    if (_checkedAt == null) return false;
    final now = DateTime.now();
    return _checkedAt!.year == now.year && _checkedAt!.month == now.month && _checkedAt!.day == now.day;
  }
  DateTime? get checkedAt => _checkedAt;

  /// Mood strings for the level.
  String get label => ['Low', 'Medium', 'High'][_level.clamp(0, 2)];

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _level = prefs.getInt(_key) ?? 1;
    final d = prefs.getString(_dateKey);
    if (d != null) _checkedAt = DateTime.tryParse(d);
    notifyListeners();
  }

  Future<void> setLevel(int level) async {
    _level = level.clamp(0, 2);
    _checkedAt = DateTime.now();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_key, _level);
    await prefs.setString(_dateKey, _checkedAt!.toIso8601String());
    notifyListeners();
  }

  Future<void> clear() async {
    _checkedAt = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_dateKey);
    notifyListeners();
  }
}
