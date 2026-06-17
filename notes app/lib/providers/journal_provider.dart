import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/journal_entry.dart';
import '../services/database_service.dart';

class JournalProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final Uuid _uuid = const Uuid();
  List<JournalEntry> _entries = [];
  int _streak = 0;

  List<JournalEntry> get entries => _entries;
  int get streak => _streak;

  Future<void> load() async {
    _entries = await _db.getJournalEntries();
    _streak = await _db.getJournalStreak();
    notifyListeners();
  }

  JournalEntry? get todayEntry {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    return _entries.where((e) => e.createdAt.toIso8601String().substring(0, 10) == today).firstOrNull;
  }

  Future<void> save({required String content, int mood = 1}) async {
    final today = DateTime.now().toIso8601String().substring(0, 10);
    final existing = _entries.where((e) => e.createdAt.toIso8601String().substring(0, 10) == today).firstOrNull;
    if (existing != null) {
      final u = existing.copyWith(content: content, mood: mood);
      await _db.insertJournalEntry(u);
      final i = _entries.indexWhere((e) => e.id == existing.id);
      if (i != -1) _entries[i] = u;
    } else {
      final e = JournalEntry(id: _uuid.v4(), content: content, mood: mood);
      await _db.insertJournalEntry(e);
      _entries.insert(0, e);
    }
    _streak = await _db.getJournalStreak();
    notifyListeners();
  }
}
