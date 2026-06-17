import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/note.dart';
import '../services/database_service.dart';

enum NoteSortMode { updatedDesc, createdDesc, titleAsc }

class NotesProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final Uuid _uuid = const Uuid();

  List<Note> _notes = [];
  List<Note> _archived = [];
  String _searchQuery = '';
  NoteSortMode _sort = NoteSortMode.updatedDesc;
  bool _grid = false;
  Note? _lastDeleted;

  List<Note> get notes => _sorted(_searchQuery.isEmpty ? _notes : _notes.where((n) => n.title.toLowerCase().contains(_searchQuery.toLowerCase()) || n.content.toLowerCase().contains(_searchQuery.toLowerCase())).toList());
  List<Note> get archived => _archived;
  String get searchQuery => _searchQuery;
  NoteSortMode get sort => _sort;
  bool get grid => _grid;
  int get count => _notes.length;

  List<Note> _sorted(List<Note> list) {
    final s = List<Note>.from(list);
    switch (_sort) {
      case NoteSortMode.updatedDesc: s.sort((a, b) => b.updatedAt.compareTo(a.updatedAt)); break;
      case NoteSortMode.createdDesc: s.sort((a, b) => b.createdAt.compareTo(a.createdAt)); break;
      case NoteSortMode.titleAsc: s.sort((a, b) => a.title.compareTo(b.title)); break;
    }
    return s;
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _grid = prefs.getBool('noteGrid') ?? false;
    _sort = NoteSortMode.values[prefs.getInt('noteSort') ?? 0];
    await load();
  }

  Future<void> load() async {
    _notes = await _db.getNotes();
    _archived = await _db.getArchivedNotes();
    notifyListeners();
  }

  Future<void> add({required String title, required String content, String category = 'General', int color = 0xFF6C63FF, String? projectId}) async {
    final note = Note(id: _uuid.v4(), title: title, content: content, category: category, color: color, projectId: projectId);
    await _db.insertNote(note);
    _notes.insert(0, note);
    notifyListeners();
  }

  Future<void> update({required String id, required String title, required String content, String? category, int? color, String? projectId, bool clearProject = false}) async {
    final existing = await _db.getNote(id);
    if (existing == null) return;
    final u = existing.copyWith(title: title, content: content, category: category ?? existing.category, color: color ?? existing.color, projectId: clearProject ? null : projectId, updatedAt: DateTime.now());
    await _db.updateNote(u);
    final i = _notes.indexWhere((n) => n.id == id);
    if (i != -1) _notes[i] = u;
    notifyListeners();
  }

  Future<void> remove(String id) async {
    final i = _notes.indexWhere((n) => n.id == id);
    if (i != -1) _lastDeleted = _notes[i];
    await _db.deleteNote(id);
    _notes.removeWhere((n) => n.id == id);
    notifyListeners();
  }

  Future<void> undoDelete() async {
    if (_lastDeleted == null) return;
    await _db.insertNote(_lastDeleted!);
    _notes.insert(0, _lastDeleted!);
    _lastDeleted = null;
    notifyListeners();
  }

  Future<void> togglePin(String id) async {
    final n = _notes.firstWhere((x) => x.id == id);
    final p = !n.isPinned;
    await _db.updateNote(n.copyWith(isPinned: p, updatedAt: DateTime.now()));
    final i = _notes.indexWhere((x) => x.id == id);
    if (i != -1) _notes[i] = n.copyWith(isPinned: p);
    notifyListeners();
  }

  Future<void> toggleArchive(String id) async {
    final ai = _notes.indexWhere((n) => n.id == id);
    if (ai != -1) {
      final note = _notes.removeAt(ai);
      await _db.updateNote(note.copyWith(isArchived: true, updatedAt: DateTime.now()));
      _archived.insert(0, note.copyWith(isArchived: true));
    } else {
      final i = _archived.indexWhere((n) => n.id == id);
      if (i != -1) {
        final note = _archived.removeAt(i);
        await _db.updateNote(note.copyWith(isArchived: false, updatedAt: DateTime.now()));
        _notes.insert(0, note.copyWith(isArchived: false));
      }
    }
    notifyListeners();
  }

  Future<void> toggleLock(String id) async {
    final i = _notes.indexWhere((n) => n.id == id);
    if (i == -1) return;
    final n = _notes[i];
    final l = !n.isLocked;
    await _db.updateNote(n.copyWith(isLocked: l, updatedAt: DateTime.now()));
    _notes[i] = n.copyWith(isLocked: l);
    notifyListeners();
  }

  void setSearch(String q) { _searchQuery = q; notifyListeners(); }
  void toggleGrid() async { _grid = !_grid; final p = await SharedPreferences.getInstance(); await p.setBool('noteGrid', _grid); notifyListeners(); }
  void setSort(NoteSortMode s) async { _sort = s; final p = await SharedPreferences.getInstance(); await p.setInt('noteSort', s.index); notifyListeners(); }
}
