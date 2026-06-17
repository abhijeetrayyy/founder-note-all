import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/tag.dart';
import '../services/database_service.dart';

class TagProvider extends ChangeNotifier {
  final DatabaseService _db = DatabaseService.instance;
  final Uuid _uuid = const Uuid();
  List<Tag> _tags = [];
  Map<String, int> _counts = {};

  List<Tag> get tags => _tags;
  Map<String, int> get counts => _counts;

  Future<void> load() async {
    _tags = await _db.getTags();
    _counts = await _db.getTagCounts();
    notifyListeners();
  }

  Future<void> add({required String name, int color = 0xFF6C63FF}) async {
    final t = Tag(id: _uuid.v4(), name: name, color: color);
    await _db.insertTag(t);
    _tags.add(t);
    notifyListeners();
  }

  Future<void> remove(String id) async {
    await _db.deleteTag(id);
    _tags.removeWhere((t) => t.id == id);
    notifyListeners();
  }

  Future<List<Tag>> getForNote(String noteId) async => await _db.getTagsForNote(noteId);
  Future<List<Tag>> getForTask(String taskId) async => await _db.getTagsForTask(taskId);

  Future<void> setNoteTags(String noteId, List<String> tagIds) async {
    await _db.setNoteTags(noteId, tagIds);
    _counts = await _db.getTagCounts();
    notifyListeners();
  }

  Future<void> setTaskTags(String taskId, List<String> tagIds) async {
    await _db.setTaskTags(taskId, tagIds);
    _counts = await _db.getTagCounts();
    notifyListeners();
  }
}
